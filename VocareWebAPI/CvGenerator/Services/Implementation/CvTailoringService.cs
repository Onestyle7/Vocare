using System.Text.Json;
using Microsoft.Extensions.Options;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Models.Enums;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Repositories;
using VocareWebAPI.Services;

namespace VocareWebAPI.CvGenerator.Repositories.Implementations
{
    public class CvTailoringService : ICvTailoringService
    {
        private readonly HttpClient _httpClient;
        private readonly IGeneratedCvRepository _generatedCvRepository;
        private readonly ILogger<CvTailoringService> _logger;
        private readonly OpenAIConfig _config;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly ICvManagementService _CvManagementService;
        private readonly UserProfileService _userProfileService;

        public CvTailoringService(
            HttpClient httpClient,
            IGeneratedCvRepository generatedCvRepository,
            ILogger<CvTailoringService> logger,
            IOptions<OpenAIConfig> aiConfig,
            IUserProfileRepository userProfileRepositor,
            ICvManagementService cvManagementService,
            UserProfileService userProfileService
        )
        {
            _httpClient = httpClient;
            _generatedCvRepository = generatedCvRepository;
            _logger = logger;
            _config = aiConfig.Value;
            _userProfileRepository = userProfileRepositor;
            _CvManagementService = cvManagementService;
            _userProfileService = userProfileService;

            _httpClient.Timeout = TimeSpan.FromSeconds(180);
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<CvDetailsDto> GenerateTargetedCvAsync(
            GenerateTargetCvDto generateTargetCvDto,
            string userId
        )
        {
            #region mode: Dostosowanie aktualnego CV do oferty pracy (Tailor)
            if (generateTargetCvDto.Mode == Mode.Tailor)
            {
                var cv = await _generatedCvRepository.GetByIdAsync(generateTargetCvDto.CvId.Value);
                if (cv == null)
                {
                    throw new KeyNotFoundException("Cv not exist");
                }

                var belongsToUser = await _generatedCvRepository.BelongsToUserAsync(
                    generateTargetCvDto.CvId.Value,
                    userId
                );
                if (!belongsToUser)
                {
                    throw new UnauthorizedAccessException("Cv not belong to user");
                }

                var prompt = BuildPrompt(cv.CvJson, generateTargetCvDto);
                var tailoredCv = await CallOpenAiAsync(prompt);
                cv.CvJson = JsonSerializer.Serialize(
                    tailoredCv,
                    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
                );

                await _generatedCvRepository.UpdateAsync(cv);
                return new CvDetailsDto
                {
                    Id = cv.Id,
                    Name = cv.Name,
                    TargetPosition = cv.TargetPosition,
                    CvData = tailoredCv,
                    IsDefault = cv.IsDefault,
                    CreatedAt = cv.CreatedAt,
                    LastModifiedAt = cv.LastModifiedAt,
                    Version = cv.Version,
                    Notes = cv.Notes,
                };
            }
            #endregion
            #region mode: Generowanie nowego Cv na podstawie profilu użytkownika i oferty pracy (Generate)
            else if (generateTargetCvDto.Mode == Mode.Generate)
            {
                var userProfile = await _userProfileRepository.GetUserProfileByIdAsync(userId);
                if (userProfile == null)
                {
                    throw new KeyNotFoundException("User profile not found");
                }

                var canCreate = await _CvManagementService.CanCreateNewCvAsync(userId);
                if (!canCreate)
                {
                    throw new InvalidOperationException(
                        "CV limit reached. Upgrade to premium or delete existing CV."
                    );
                }

                var userProfileDto = await _userProfileService.GetUserProfileAsync(userId);
                var sourceData = JsonSerializer.Serialize(
                    userProfileDto,
                    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
                );

                var prompt = BuildPrompt(sourceData, generateTargetCvDto);
                var generatedCv = await CallOpenAiAsync(prompt);

                var newCv = new GeneratedCv
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Name = generateTargetCvDto.Name ?? "Targeted CV",
                    TargetPosition = generateTargetCvDto.Name ?? "Targeted CV",
                    CvJson = JsonSerializer.Serialize(
                        generatedCv,
                        new JsonSerializerOptions
                        {
                            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        }
                    ),
                    IsDefault = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    LastModifiedAt = DateTime.UtcNow,
                    Version = 1,
                };
                await _generatedCvRepository.AddAsync(newCv);
                return new CvDetailsDto
                {
                    Id = newCv.Id,
                    Name = newCv.Name,
                    TargetPosition = newCv.TargetPosition,
                    CvData = generatedCv,
                    IsDefault = newCv.IsDefault,
                    CreatedAt = newCv.CreatedAt,
                    LastModifiedAt = newCv.LastModifiedAt,
                    Version = newCv.Version,
                };
            }
            #endregion
            else
            {
                throw new ArgumentException("Invalid mode. Use 'Tailor' or 'Generate'.");
            }
        }

        private async Task<CvDto> CallOpenAiAsync(string prompt)
        {
            var requestBody = new
            {
                model = _config.Model,
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content = "Jesteś ekspertem doradztwa zawodowego z wieloletnim doświadczeniem. "
                            + "Doskonale znasz realia rynku pracy i wiesz, jak dostosować CV do konkretnej oferty pracy, aby zwiększyć szanse na zatrudnienie. "
                            + "Zawsze odpowiadasz w formacie JSON.",
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
                        $"OpenAI API error: {response.StatusCode} - {responseContent}"
                    );
                    throw new Exception(
                        $"OpenAi API error: {response.StatusCode} - {responseContent}"
                    );
                }
                var apiResponse = JsonSerializer.Deserialize<OpenAiResponse>(
                    responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );
                if (apiResponse?.Choices == null || apiResponse.Choices.Count == 0)
                {
                    throw new AiServiceException("Invalid API reponse: missing choices");
                }
                var content = apiResponse.Choices[0].Message?.Content;
                if (string.IsNullOrWhiteSpace(content))
                {
                    throw new AiServiceException("Invalid API reponse: empty content");
                }

                var result = JsonSerializer.Deserialize<CvDto>(
                    content,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );
                if (result == null)
                {
                    throw new AiServiceException(
                        "Failed to parse career recommendations from JSON"
                    );
                }
                return result;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error comunicating with OpenAI API");
                throw new AiServiceException("Błąd komunikacji z API", ex);
            }
        }

        private class AiServiceException : Exception // TODO: przenieść do osobnego pliku, ta sama klasa używana w CvAnalysisService i innych AI services
        {
            public AiServiceException(string message)
                : base(message) { }

            public AiServiceException(string message, Exception inner)
                : base(message, inner) { }
        }

        private string BuildPrompt(string sourceData, GenerateTargetCvDto dto)
        {
            return $$"""
                Na podstawie poniższych danych źródłowych wygeneruj CV zoptymalizowane pod podaną ofertę pracy.
                Odpowiedz WYŁĄCZNIE poprawnym JSONem — bez komentarzy, bez markdown, bez tekstu przed/po JSON.

                ZASADY:
                1. NIE WYMYŚLAJ danych, których nie ma w źródle. Nie dodawaj fałszywego doświadczenia, firm, projektów ani umiejętności.
                2. PRZEFORMUŁUJ opisy doświadczenia tak, aby podkreślały aspekty najbardziej istotne dla oferty.
                3. PRIORYTETYZUJ umiejętności — te najważniejsze dla oferty przenieś na początek listy.
                4. DOSTOSUJ podsumowanie zawodowe (summary) — powinno jasno komunikować dopasowanie do roli z oferty.
                5. Zachowaj WSZYSTKIE sekcje CV, nawet jeśli są puste — zwróć je jako puste listy [].
                6. Zachowaj prawdziwe daty, nazwy firm, uczelni i certyfikatów — nie modyfikuj faktów.
                8. Jeśli w danych źródłowych brakuje sekcji Projects lub Social, zwróć puste listy.

                OPIS OFERTY PRACY:
                {{dto.JobDescription}}

                DANE ŹRÓDŁOWE (profil użytkownika lub istniejące CV):
                {{sourceData}}

                WYMAGANY FORMAT JSON (CvDto):
                {
                    "basics": {
                        "firstName": "string",
                        "lastName": "string",
                        "phoneNumber": "string",
                        "email": "string",
                        "summary": "string — podsumowanie dostosowane do oferty pracy",
                        "location": {
                            "city": "string",
                            "country": "string"
                        }
                    },
                    "work": [
                        {
                            "company": "string",
                            "position": "string",
                            "startDate": "YYYY-MM-DD",
                            "endDate": "YYYY-MM-DD lub Present",
                            "description": "string — opis przeformułowany pod ofertę, podkreślający relevant doświadczenie"
                        }
                    ],
                    "education": [
                        {
                            "institution": "string",
                            "degree": "string",
                            "field": "string",
                            "startDate": "YYYY-MM-DD",
                            "endDate": "YYYY-MM-DD"
                        }
                    ],
                    "certificates": [
                        {
                            "name": "string",
                            "date": "YYYY-MM-DD"
                        }
                    ],
                    "skills": ["string — posortowane od najważniejszych dla oferty"],
                    "languages": [
                        {
                            "language": "string",
                            "fluency": "string"
                        }
                    ],
                    "projects": [
                        {
                            "name": "string",
                            "description": "string",
                            "link": "string"
                        }
                    ],
                    "social": [
                        {
                            "social": "string",
                            "link": "string"
                        }
                    ]
                }
                """;
        }
    }
}
