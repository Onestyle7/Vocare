using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using UglyToad.PdfPig;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.CareerAdvisor.Services.Interfaces;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Services;
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
            // 1. Walidacja pliku
            string fileType = Path.GetExtension(file.FileName).ToLower();
            if (fileType != ".pdf")
            {
                throw new NotSupportedException(
                    "Nie wspierane rozszerzenie pliku. Obsługiwany format to PDF!"
                );
            }

            if (file.Length > MaxFileSizeBytes)
            {
                throw new NotSupportedException(
                    "Plik jest zbyt duży. Maksymalny rozmiar pliku to 2MB."
                );
            }

            var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
            var hasActiveSubscription =
                userBilling?.SubscriptionStatus == SubscriptionStatus.Active;

            // 2. Sprawdzenie czy user już używał parsera
            if (!hasActiveSubscription)
            {
                var parseCount = await _cvParseHistoryRepository.CountByUserIdAsync(userId);
                if (parseCount > 0)
                {
                    throw new InvalidOperationException(
                        "Funkcja importu CV została już wykorzystana. Wykup subskrypcję, aby korzystać bez limitu."
                    );
                }
            }

            // 3. Ekstrakcja tekstu z PDF
            string extractedText = ExtractTextFromPdf(file);

            if (string.IsNullOrWhiteSpace(extractedText))
            {
                throw new InvalidOperationException("Nie udało się wyodrębnić tekstu z pliku PDF.");
            }

            // 4. Wywołanie OpenAI
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
                    throw new Exception($"OpenAI API returned error: {response.StatusCode}");
                }

                // 5. Deserializacja odpowiedzi
                var apiResponse = JsonSerializer.Deserialize<OpenAiResponse>(
                    responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                var content = apiResponse?.Choices[0].Message?.Content;

                if (string.IsNullOrWhiteSpace(content))
                {
                    throw new InvalidOperationException("OpenAI zwróciło pustą odpowiedź.");
                }

                var result = JsonSerializer.Deserialize<UserProfileDto>(
                    content,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (result == null)
                {
                    throw new InvalidOperationException(
                        "Nie udało się sparsować odpowiedzi z OpenAI."
                    );
                }
                result.FirstName ??= string.Empty;
                result.LastName ??= string.Empty;
                result.Country ??= string.Empty;
                result.PersonalityType ??= PersonalityType.Unknown;

                // 6. Zapis profilu
                await _userProfileService.CreateUserProfileAsync(userId, result);

                // 7. Zapis do historii
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
                _logger.LogError(ex, "Błąd podczas komunikacji z OpenAI API.");
                throw new InvalidOperationException(
                    "Nie udało się przetworzyć CV. Spróbuj ponownie później."
                );
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
                    "phoneNumber": "string lub null",
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
