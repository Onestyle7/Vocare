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
                result.PersonalityType ??= PersonalityType.Unknown;

                if (string.IsNullOrWhiteSpace(result.Country))
                {
                    result.Country = "Poland";
                }

                if(result.Education != null)
                {
                    foreach(var record in result.Education)
                    {
                        record.Institution ??= string.Empty;
                        record.Degree ??= string.Empty;
                        record.Field ??= string.Empty;
                    }
                    result.Education = result.Education
                        .Where(e => !string.IsNullOrWhiteSpace(e.Institution))
                        .ToList();
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
                    result.WorkExperience = result.WorkExperience
                        .Where(w => !string.IsNullOrWhiteSpace(w.Company))
                        .ToList();
                }

                if(result.Certificates != null)
                {
                    foreach(var record in result.Certificates)
                    {
                        record.Name ??= string.Empty;
                    }
                    result.Certificates = result.Certificates
                        .Where(c => !string.IsNullOrWhiteSpace(c.Name))
                        .ToList();
                }

                if(result.Languages != null)
                {
                    foreach(var record in result.Languages)
                    {
                        record.Language ??= string.Empty;
                        record.Level ??= string.Empty;
                    }
                    result.Languages = result.Languages
                        .Where(l => !string.IsNullOrWhiteSpace(l.Language))
                        .ToList();
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
                Przeanalizuj poniższe CV i wyodrębnij dane do formatu JSON.
                Odpowiedz WYŁĄCZNIE poprawnym JSONem — bez komentarzy, bez markdown, bez tekstu przed/po JSON.

                ZASADY KRYTYCZNE (naruszenie którejkolwiek dyskwalifikuje odpowiedź):
                1. ZAKAZ FABRYKACJI: Wyodrębniaj WYŁĄCZNIE informacje, które jawnie występują w tekście CV. Nie domyślaj się, nie uzupełniaj, nie generuj danych na podstawie kontekstu. Jeśli czegoś nie ma — zwróć null lub pustą tablicę [].
                2. DUPLIKATY: Jeśli te same dane pojawiają się w CV wielokrotnie (np. to samo stanowisko w tej samej firmie z tym samym okresem), zwróć JE TYLKO RAZ. Zduplikowane wpisy oznaczają błąd w ekstrakcji tekstu z PDF, nie dwa osobne doświadczenia.
                3. WALIDACJA WPISÓW: Jeśli wpis nie zawiera wystarczających danych do identyfikacji (np. brak nazwy firmy LUB brak stanowiska w doświadczeniu zawodowym, brak nazwy uczelni w edukacji), POMIŃ go całkowicie zamiast zwracać wpis z pustymi polami.

                ZASADY EKSTRAKCJI:
                4. DATY: Format YYYY-MM-DD. Jeśli znany tylko miesiąc i rok (np. "March 2025"), użyj pierwszego dnia miesiąca (2025-03-01). Jeśli znany tylko rok, użyj YYYY-01-01. Jeśli praca trwa do teraz ("present", "obecnie", "current"), ustaw endDate na null.
                5. NUMER TELEFONU: Zidentyfikuj numer telefonu. Usuń numer kierunkowy kraju (np. +48, 0048) oraz wszystkie spacje, myślniki i nawiasy. Wynik MUSI być ciągiem dokładnie 9 cyfr (np. "123456789"). Jeśli po oczyszczeniu numer nie ma 9 cyfr, zwróć null.
                6. UMIEJĘTNOŚCI: Rozdziel na skills (techniczne: języki programowania, narzędzia, platformy, frameworki) i softSkills (komunikacja, praca zespołowa, zarządzanie czasem). Każda umiejętność to JEDEN krótki termin, nie zdanie.
                7. DOŚWIADCZENIE ZAWODOWE: Pole "description" to krótkie podsumowanie roli (1-2 zdania). Pole "responsibilities" to tablica konkretnych obowiązków — jeden obowiązek na element, bez kropki na końcu. Jeśli CV opisuje obowiązki ciągłym tekstem, rozbij go na logiczne punkty.
                8. JĘZYK ODPOWIEDZI: Zachowaj oryginalny język treści z CV. Nie tłumacz.

                WYMAGANY FORMAT JSON:
                {
                    "firstName": "string — dokładnie z CV, lub null",
                    "lastName": "string — dokładnie z CV, lub null",
                    "country": "string — kraj, lub null",
                    "address": "string — miasto/adres, lub null",
                    "phoneNumber": "string — 9 cyfr po oczyszczeniu, lub null",
                    "education": [
                        {
                            "institution": "string — dokładna nazwa uczelni/szkoły",
                            "degree": "string — tytuł/stopień (np. Engineer's Degree, Master's Degree)",
                            "field": "string — kierunek studiów",
                            "startDate": "YYYY-MM-DD",
                            "endDate": "YYYY-MM-DD lub null jeśli w trakcie"
                        }
                    ],
                    "workExperience": [
                        {
                            "company": "string — dokładna nazwa firmy",
                            "position": "string — dokładne stanowisko z CV",
                            "description": "string — krótkie podsumowanie roli, 1-2 zdania",
                            "responsibilities": [
                                "string — jeden konkretny obowiązek",
                                "string — kolejny obowiązek"
                            ],
                            "startDate": "YYYY-MM-DD",
                            "endDate": "YYYY-MM-DD lub null jeśli obecna praca"
                        }
                    ],
                    "skills": ["string — umiejętność techniczna"],
                    "softSkills": ["string — umiejętność miękka"],
                    "certificates": [
                        {
                            "name": "string — nazwa certyfikatu",
                            "date": "YYYY-MM-DD lub null",
                            "issuer": "string — wydawca, lub null"
                        }
                    ],
                    "languages": [
                        {
                            "language": "string — nazwa języka",
                            "level": "string — poziom (np. B2, C1, native, Advanced)"
                        }
                    ],
                    "aboutMe": "string — sekcja 'o mnie' / podsumowanie zawodowe, lub null"
                }

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
