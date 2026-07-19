using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using Pgvector.EntityFrameworkCore;
using UglyToad.PdfPig;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.CareerAdvisor.Services.Interfaces;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Services;
using VocareWebAPI.Shared.Exceptions;
using VocareWebAPI.UserManagement.Exceptions;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Models.Enums;
using VocareWebAPI.UserManagement.Repositories.Interfaces;

namespace VocareWebAPI.CareerAdvisor.Services.Implementations
{
    public class CvParserService : ICvParserService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<CvParserService> _logger;
        private readonly ICvParseHistoryRepository _cvParseHistoryRepository;
        private readonly UserProfileService _userProfileService;
        private readonly OpenAIConfig _config;
        private const long MaxFileSizeBytes = 2 * 1024 * 1024; // 2MB
        private const int FreeParseLimit = 1; // TODO: W przyszłości mozna to zmienić na IOptions<>
        private readonly IUserBillingRepository _userBillingRepository;

        public CvParserService(
            HttpClient httpClient,
            ILogger<CvParserService> logger,
            ICvParseHistoryRepository cvParseHistoryRepository,
            UserProfileService userProfileService,
            IOptions<OpenAIConfig> config,
            IUserBillingRepository userBillingRepository
        )
        {
            _config = config.Value;
            _httpClient = httpClient;
            _logger = logger;
            _cvParseHistoryRepository = cvParseHistoryRepository;
            _userProfileService = userProfileService;
            _userBillingRepository = userBillingRepository;

            _httpClient.Timeout = TimeSpan.FromSeconds(180);
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<UserProfileDto> ParseAndSaveAsync(IFormFile file, string userId)
        {
            string fileType = Path.GetExtension(file.FileName).ToLower();
            if (fileType != ".pdf")
                throw new UnsupportedFileFormatException(fileType);

            if (file.Length > MaxFileSizeBytes)
                throw new FileSizeExceededException(file.Length, MaxFileSizeBytes);

            var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
            var hasActiveSubscription =
                userBilling?.SubscriptionStatus == SubscriptionStatus.Active;

            if (!hasActiveSubscription)
            {
                var parseCount = await _cvParseHistoryRepository.CountByUserIdAsync(userId);
                if (parseCount >= FreeParseLimit)
                    throw new CvImportLimitReachedException(parseCount, FreeParseLimit);
            }

            string extractedText = ExtractTextFromPdf(file);

            if (string.IsNullOrWhiteSpace(extractedText))
                throw new CvParsingFailedException("Failed to extract text from PDF");

            var prompt = BuildCvParsePrompt(extractedText);
            var requestBody = new
            {
                model = _config.Model,
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content = "Jesteś ekspertem od analizy CV. Odpowiadasz wyłącznie w formacie JSON.",
                    },
                    new { role = "user", content = prompt },
                },
                response_format = new { type = "json_object" },
            };

            try
            {
                var response = await _httpClient.PostAsJsonAsync(
                    "https://api.openai.com/v1/chat/completions",
                    requestBody
                );

                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError(
                        "OpenAI API error: {StatusCode}, {Response}",
                        response.StatusCode,
                        responseContent
                    );
                    throw new CvParsingFailedException($"OpenAI API error: {response.StatusCode}");
                }

                var apiResponse = JsonSerializer.Deserialize<OpenAiResponse>(
                    responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (apiResponse?.Choices == null || apiResponse.Choices.Count == 0)
                    throw new CvParsingFailedException("OpenAI API returned no choices.");

                var content = apiResponse.Choices[0].Message?.Content;

                if (string.IsNullOrWhiteSpace(content))
                    throw new CvParsingFailedException("OpenAI API returned empty content.");

                var result = JsonSerializer.Deserialize<UserProfileDto>(
                    content,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (result == null)
                    throw new CvParsingFailedException(
                        "Failed to deserialize OpenAI response into UserProfileDto."
                    );

                result.FirstName ??= string.Empty;
                result.LastName ??= string.Empty;
                result.Country ??= string.Empty;
                result.PersonalityType ??= PersonalityType.Unknown;

                if(result.Education != null)
                {
                    foreach(var record in result.Education)
                    {
                        record.Institution ??= string.Empty;
                        record.Degree ??= string.Empty;
                        record.Field ??= string.Empty;
                    }
                }

                if(result.WorkExperience != null)
                {
                    foreach(var record in result.WorkExperience)
                    {
                        record.Company ??= string.Empty;
                        record.Position ??= string.Empty;
                        record.Description ??= string.Empty;
                        record.Responsibilities ??= new List<string>();
                    } 
                }

                if(result.Certificates != null)
                {
                    foreach(var record in result.Certificates)
                    {
                        record.Name ??= string.Empty;
                    }
                }

                if(result.Languages != null)
                {
                    foreach(var record in result.Languages)
                    {
                        record.Language ??= string.Empty;
                        record.Level ??= string.Empty;
                    }
                }



                await _userProfileService.CreateUserProfileAsync(userId, result);

                var history = new CvParseHistory
                {
                    UserId = userId,
                    ParseDate = DateTime.UtcNow,
                    FileName = file.FileName,
                    FileSize = file.Length,
                };
                await _cvParseHistoryRepository.CreateAsync(history);

                _logger.LogInformation(
                    "CV parsed and saved successfully for user: {UserId}",
                    userId
                );

                return result;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error communicating with OpenAI API.");
                throw new AiServiceException("Error communicating with OpenAI API.", ex);
            }
        }

        private string ExtractTextFromPdf(IFormFile file)
        {
            var textBuilder = new StringBuilder();

            using (var stream = file.OpenReadStream())
            {
                using (var document = PdfDocument.Open(stream))
                {
                    foreach (var page in document.GetPages())
                    {
                        textBuilder.AppendLine(page.Text);
                    }
                }
            }

            return textBuilder.ToString();
        }

        private string BuildCvParsePrompt(string cvText)
        {
            return $$"""
                Przeanalizuj poniższe CV i wyodrębnij następujące informacje do formatu JSON.

                Zwróć wyłącznie JSON zgodny z tą strukturą:
                {
                    "firstName": "string lub null",
                    "lastName": "string lub null",
                    "country": "string lub null",
                    "address": "string lub null",
                    "phoneNumber": "string zawierający dokładnie 9 cyfr ciągiem (np. '123456789') lub null", 
                    "education": [
                        {
                            "institution": "nazwa uczelni/szkoły",
                            "degree": "tytuł/stopień",
                            "field": "kierunek",
                            "startDate": "YYYY-MM-DD",
                            "endDate": "YYYY-MM-DD lub null jeśli w trakcie"
                        }
                    ],
                    "workExperience": [
                        {
                            "company": "nazwa firmy",
                            "position": "stanowisko",
                            "description": "opis obowiązków",
                            "responsibilities": ["obowiązek1", "obowiązek2"],
                            "startDate": "YYYY-MM-DD",
                            "endDate": "YYYY-MM-DD lub null jeśli obecna praca"
                        }
                    ],
                    "skills": ["umiejętność1", "umiejętność2"],
                    "softSkills": ["umiejętność miękka1", "umiejętność miękka2"],
                    "certificates": [
                        {
                            "name": "nazwa certyfikatu",
                            "date": "YYYY-MM-DD lub null",
                            "issuer": "wydawca lub null"
                        }
                    ],
                    "languages": [
                        {
                            "language": "nazwa języka",
                            "level": "poziom np. B2, native, biegły"
                        }
                    ],
                    "aboutMe": "string lub null - jeśli CV zawiera sekcję 'o mnie' lub podsumowanie zawodowe"
                }

                Zasady:
                - Jeśli jakiejś informacji nie ma w CV, ustaw null lub pustą tablicę []
                - Daty w formacie YYYY-MM-DD. Jeśli znany tylko rok, użyj YYYY-01-01
                - Rozróżniaj skills (techniczne: języki programowania, narzędzia) od softSkills (komunikacja, praca zespołowa)
                - Nie wymyślaj danych których nie ma w CV
                - Pole 'phoneNumber': Zidentyfikuj numer telefonu. Najpierw usuń z niego numer kierunkowy kraju (np. +48, 0048, 48) oraz absolutnie wszystkie spacje, myślniki i nawiasy. Wynik końcowy MUSI być ciągiem tekstowym składającym się z dokładnie 9 cyfr (np. "123456789"). Jeśli po oczyszczeniu numer nie ma 9 cyfr, zwróć null.

                CV:
                {{cvText}}
                """;
        }

        public class OpenAiResponse
        {
            [JsonPropertyName("choices")]
            public List<OpenAiChoice> Choices { get; set; } = new();
        }

        public class OpenAiChoice
        {
            [JsonPropertyName("message")]
            public OpenAiMessage Message { get; set; } = new();
        }

        public class OpenAiMessage
        {
            [JsonPropertyName("content")]
            public string Content { get; set; } = string.Empty;
        }
    }
}
