using System.Text.Json;
using Microsoft.Extensions.Options;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.CvGenerator.Exceptions;
using VocareWebAPI.CvGenerator.Interfaces;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Repositories;
using VocareWebAPI.Services;
using VocareWebAPI.Shared.Exceptions;
using VocareWebAPI.Shared.Results;
using VocareWebAPI.UserManagement.Exceptions;
using static VocareWebAPI.Services.PerplexityAiService;

namespace VocareWebAPI.CvGenerator.Implementations
{
    public class CvTailoringService : ICvTailoringService
    {
        private readonly HttpClient _httpClient;
        private readonly IGeneratedCvRepository _generatedCvRepository;
        private readonly ILogger<CvTailoringService> _logger;
        private readonly OpenAIConfig _config;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly ICvManagementService _cvManagementService;
        private readonly UserProfileService _userProfileService;

        public CvTailoringService(
            HttpClient httpClient,
            IGeneratedCvRepository generatedCvRepository,
            ILogger<CvTailoringService> logger,
            IOptions<OpenAIConfig> aiConfig,
            IUserProfileRepository userProfileRepository,
            ICvManagementService cvManagementService,
            UserProfileService userProfileService
        )
        {
            _httpClient = httpClient;
            _generatedCvRepository = generatedCvRepository;
            _logger = logger;
            _config = aiConfig.Value;
            _userProfileRepository = userProfileRepository;
            _cvManagementService = cvManagementService;
            _userProfileService = userProfileService;

            _httpClient.Timeout = TimeSpan.FromSeconds(180);
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<CvDetailsDto> TailorCvAsync(TailorCvDto dto, string userId)
        {
            var cv = await _generatedCvRepository.GetByIdAsync(dto.CvId);
            if (cv == null)
                throw new CvNotFoundException(dto.CvId);

            var belongsToUser = await _generatedCvRepository.BelongsToUserAsync(dto.CvId, userId);
            if (!belongsToUser)
                throw new CvAccessDeniedException(dto.CvId);

            var sourceCv = JsonSerializer.Deserialize<CvDto>(
                cv.CvJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            ) ?? new CvDto();
            var prompt = BuildPrompt(cv.CvJson, dto.JobDescription);
            var tailoredCv = await CallOpenAiAsync(prompt);
            RestoreEducationDescriptions(sourceCv, tailoredCv);
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

        private void RestoreEducationDescriptions(CvDto sourceCv, CvDto tailoredCv)
{
    var sourceEducationEntries = sourceCv.Education?.ToList()
        ?? new List<CvEducationEntryDto>();

    foreach (var tailoredEducation in tailoredCv.Education ?? new List<CvEducationEntryDto>())
    {
        var sourceEducationIndex = sourceEducationEntries.FindIndex(source =>
            source.Institution == tailoredEducation.Institution
            && source.Degree == tailoredEducation.Degree
            && source.Field == tailoredEducation.Field
            && source.StartDate == tailoredEducation.StartDate
            && source.EndDate == tailoredEducation.EndDate
        );

        if (sourceEducationIndex < 0)
        {
            sourceEducationIndex = sourceEducationEntries.FindIndex(source =>
                source.Institution == tailoredEducation.Institution
                && source.StartDate == tailoredEducation.StartDate
                && source.EndDate == tailoredEducation.EndDate
            );
        }

        if (sourceEducationIndex >= 0)
        {
            var sourceEducation = sourceEducationEntries[sourceEducationIndex];

            tailoredEducation.Description = sourceEducation.Description;

            sourceEducationEntries.RemoveAt(sourceEducationIndex);
        }
    }
}

        public async Task<Result<CvDetailsDto>> GenerateCvFromProfileAsync(
            GenerateCvFromProfileDto dto,
            string userId
        )
        {
            var userProfile = await _userProfileRepository.GetUserProfileByIdAsync(userId);
            if (userProfile == null)
                throw new UserProfileNotFoundException(userId);

            var canCreate = await _cvManagementService.CanCreateNewCvAsync(userId);
            if (!canCreate)
            {
                return Result<CvDetailsDto>.Fail(
                    new Error(
                        "CV_LIMIT_REACHED",
                        $"CV limit reached for user {userId}. Cannot create more CVs."
                    )
                );
            }

            var userProfileDto = await _userProfileService.GetUserProfileAsync(userId);
            var sourceData = JsonSerializer.Serialize(
                userProfileDto,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );

            var prompt = BuildPrompt(sourceData, dto.JobDescription);
            var generatedCv = await CallOpenAiAsync(prompt);

            var newCv = new GeneratedCv
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = dto.Name ?? "Targeted CV",
                TargetPosition = dto.Name ?? "Targeted CV",
                CvJson = JsonSerializer.Serialize(
                    generatedCv,
                    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
                ),
                IsDefault = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                LastModifiedAt = DateTime.UtcNow,
                Version = 1,
            };
            await _generatedCvRepository.AddAsync(newCv);
            return Result<CvDetailsDto>.Ok(
                new CvDetailsDto
                {
                    Id = newCv.Id,
                    Name = newCv.Name,
                    TargetPosition = newCv.TargetPosition,
                    CvData = generatedCv,
                    IsDefault = newCv.IsDefault,
                    CreatedAt = newCv.CreatedAt,
                    LastModifiedAt = newCv.LastModifiedAt,
                    Version = newCv.Version,
                }
            );
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
                    throw new AiServiceException(
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

        private string BuildPrompt(string sourceData, string jobDescription)
        {
            return $$"""
                Na podstawie poniższych danych źródłowych wygeneruj CV zoptymalizowane pod podaną ofertę pracy.
                Odpowiedz WYŁĄCZNIE poprawnym JSONem — bez komentarzy, bez markdown, bez tekstu przed/po JSON.

                ZASADY KRYTYCZNE (naruszenie którejkolwiek dyskwalifikuje odpowiedź):
                1. ZAKAZ FABRYKACJI: Używaj wyłącznie faktów obecnych w danych źródłowych. Nie dodawaj doświadczenia, firm, projektów, certyfikatów ani umiejętności, których tam nie ma. Jeśli oferta wymaga umiejętności, której kandydat nie posiada — NIE dodawaj jej. Lepsze jest CV bez danej umiejętności niż CV z kłamstwem.
                2. FAKTY SĄ NIEZMIENNE: Daty, nazwy firm, uczelni, stanowisk i certyfikatów przepisz dokładnie tak, jak występują w źródle. Wolno Ci je pominąć, jeśli są nieistotne — nie wolno ich modyfikować.
                3. DANE KONTAKTOWE: Przepisz firstName, lastName, phoneNumber, email i location dokładnie ze źródła, bez żadnych zmian. Jeśli któregoś pola brakuje w źródle, zwróć pusty string "".

                ZASADY OPTYMALIZACJI (w ramach powyższych ograniczeń):
                4. PRZEFORMUŁUJ opisy doświadczenia tak, aby podkreślały aspekty najbardziej istotne dla oferty. Przeformułowanie = zmiana sformułowań i akcentów, NIE zmiana treści merytorycznej.
                5. ROZBIJ obowiązki na punkty: pole "responsibilities" to tablica stringów, gdzie każdy element to JEDEN konkretny obowiązek lub osiągnięcie. Jeśli źródło opisuje doświadczenie ciągłym tekstem, podziel go na logiczne, samodzielne punkty. Zwięźle: 1 zdanie na punkt, bez kropki na końcu.
                6. PRIORYTETYZUJ: umiejętności najważniejsze dla oferty umieść na początku listy "skills"; analogicznie uporządkuj "responsibilities" w każdej pozycji — od najbardziej istotnych dla oferty.
                7. DOSTOSUJ "summary": 2-4 zdania jasno komunikujące dopasowanie kandydata do roli z oferty, oparte wyłącznie na faktach ze źródła.

                ZASADY STRUKTURY:
                8. Zwróć WSZYSTKIE sekcje ze schematu. Sekcje bez danych w źródle (np. projects, social, certificates) zwróć jako puste listy [].
                9. Język CV: taki sam jak język OPISU OFERTY PRACY. Jeśli dane źródłowe są w innym języku niż oferta — przetłumacz treści na język oferty, zachowując merytoryczną dokładność. Nie tłumacz nazw własnych (nazwy firm, uczelni, certyfikatów).
                10. Odpowiedź musi być poprawnym JSONem zgodnym ze schematem poniżej — bez dodatkowych pól, bez zmian nazw kluczy.
                11. HOBBIES: Zwróć wyłącznie hobby obecne w danych źródłowych. Nie dodawaj nowych hobby. Jeśli w źródle ich nie ma, zwróć pustą listę [].

                OPIS OFERTY PRACY:
                {{jobDescription}}

                DANE ŹRÓDŁOWE (profil użytkownika lub istniejące CV):
                {{sourceData}}

                WYMAGANY FORMAT JSON:
                {
                    "basics": {
                        "firstName": "string — dokładnie ze źródła",
                        "lastName": "string — dokładnie ze źródła",
                        "phoneNumber": "string — dokładnie ze źródła",
                        "email": "string — dokładnie ze źródła",
                        "summary": "string — 2-4 zdania dostosowane do oferty",
                        "location": {
                            "city": "string",
                            "country": "string"
                        }
                    },
                    "work": [
                        {
                            "company": "string — dokładnie ze źródła",
                            "position": "string — dokładnie ze źródła",
                            "startDate": "YYYY-MM-DD",
                            "endDate": "YYYY-MM-DD lub Present",
                            "responsibilities": [
                                "string — jeden konkretny obowiązek lub osiągnięcie",
                                "string — kolejny obowiązek, posortowane od najistotniejszych dla oferty"
                            ]
                        }
                    ],
                    "education": [
                        {
                            "institution": "string",
                            "degree": "string",
                            "field": "string",
                            "startDate": "YYYY-MM-DD",
                            "endDate": "YYYY-MM-DD",
                            "description": "string — opis ze źródła; pusty string, jeśli go brak"
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
                    ],
                    "hobbies": [
                        "string - hobby wyłącznie z danych źródłowych"
                    ]
                }
                """;
        }
    }
}
