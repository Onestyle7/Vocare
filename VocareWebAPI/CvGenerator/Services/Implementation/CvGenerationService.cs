using System.Text.Json;
using Microsoft.Extensions.Options;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Models.Config;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.Repositories.Interfaces;

namespace VocareWebAPI.CvGenerator.Services.Implementations
{
    /// <summary>
    /// Serwis odpowiedzialny za generowanie CV na podstawie danych użytkownika i API Perplexity.
    /// </summary>
    public class CvGenerationService : ICvGenerationService
    {
        private readonly HttpClient _httpClient;
        private readonly AiConfig _config;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IGeneratedCvRepository _generatedCvRepository;
        private readonly ILogger<CvGenerationService> _logger;

        public CvGenerationService(
            HttpClient httpClient,
            IOptions<AiConfig> config,
            IUserProfileRepository userProfileRepository,
            IGeneratedCvRepository generatedCvRepository,
            ILogger<CvGenerationService> logger
        )
        {
            _httpClient = httpClient;
            _config = config.Value;
            _userProfileRepository = userProfileRepository;
            _generatedCvRepository = generatedCvRepository;
            _logger = logger;

            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<CvDto> GenerateCvAsync(string userId, string? position)
        {
            var userProfile = await _userProfileRepository.GetUserProfileByIdAsync(userId);
            if (userProfile == null)
            {
                throw new CvGenerationException($"User profile with ID: {userId} not found.", null);
            }

            var prompt = BuildPrompt(userProfile, position);
            var requestBody = new
            {
                model = _config.Model,
                messages = new[] { new { role = "user", content = prompt } },
            };

            try
            {
                var absoluteUri = new Uri(_config.BaseUrl + "/chat/completions");
                var response = await _httpClient.PostAsJsonAsync(absoluteUri, requestBody);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation(
                    "Perplexity API Response: {responseContent}",
                    responseContent
                );
                if (!response.IsSuccessStatusCode)
                {
                    throw new CvGenerationException(
                        $"API returned error {response.StatusCode}: {responseContent}",
                        null
                    );
                }

                var apiResponse = JsonSerializer.Deserialize<PerplexityApiResponseDto>(
                    responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (
                    apiResponse == null
                    || apiResponse.Choices == null
                    || !apiResponse.Choices.Any()
                )
                {
                    throw new CvGenerationException(
                        "Invalid API response: Choices are missing or empty.",
                        null
                    );
                }

                var rawContent = apiResponse.Choices[0].Message.Content;

                CvDto? result = null;

                var jsonMatch = System.Text.RegularExpressions.Regex.Match(
                    rawContent,
                    @"```json\s*([\s\S]*?)\s*```"
                );
                if (jsonMatch.Success)
                {
                    var cleanJson = jsonMatch.Groups[1].Value.Trim();
                    try
                    {
                        result = JsonSerializer.Deserialize<CvDto>(
                            cleanJson,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                        );
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(
                            "Failed to parse JSON block: {cleanJson}. Error: {ex}",
                            cleanJson,
                            ex
                        );
                        throw new CvGenerationException(
                            "Failed to parse the JSON block from API response.",
                            ex
                        );
                    }
                }
                else
                {
                    _logger.LogWarning(
                        "No JSON block found in raw content: {rawContent}",
                        rawContent
                    );
                    try
                    {
                        result = JsonSerializer.Deserialize<CvDto>(
                            rawContent,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                        );
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(
                            "Failed to parse raw content as JSON: {rawContent}. Error: {ex}",
                            rawContent,
                            ex
                        );
                        throw new CvGenerationException(
                            "Failed to parse the response content as JSON.",
                            ex
                        );
                    }
                }

                if (result == null)
                {
                    throw new CvGenerationException(
                        "Failed to deserialize the API response into CvDto.",
                        null
                    );
                }

                InitializeNullProperties(result);

                // Zapisujemy wygenerowane CV do bazy
                var cvJson = JsonSerializer.Serialize(result);
                var generatedCv = new GeneratedCv
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Position = position,
                    CvJson = cvJson,
                    RawApiResponse = responseContent,
                    GeneratedAt = DateTime.UtcNow,
                };
                await _generatedCvRepository.AddAsync(generatedCv);

                return result;
            }
            catch (Exception ex)
            {
                throw new CvGenerationException(
                    "Error while generating CV via Perplexity API.",
                    ex
                );
            }
        }

        private void InitializeNullProperties(CvDto? cv)
        {
            if (cv == null)
            {
                throw new ArgumentNullException(nameof(cv), "CvDto cannot be null.");
            }

            if (cv.Basics == null)
            {
                cv.Basics = new CvBasicsDto();
            }

            if (cv.Work == null)
            {
                cv.Work = new List<CvWorkEntryDto>();
            }

            if (cv.Education == null)
            {
                cv.Education = new List<CvEducationEntryDto>();
            }

            if (cv.Certificates == null)
            {
                cv.Certificates = new List<CvCertificateEntryDto>();
            }

            if (cv.Skills == null)
            {
                cv.Skills = new List<string>();
            }

            if (cv.Languages == null)
            {
                cv.Languages = new List<CvLanguageEntryDto>();
            }
        }

        private string BuildPrompt(UserProfile profile, string? position)
        {
            return $$"""
                Jesteś ekspertem w pisaniu profesjonalnych CV. Twoim zadaniem jest wygenerowanie CV w formacie JSON na podstawie danych użytkownika:

                Imię: {{profile.FirstName}}
                Nazwisko: {{profile.LastName}}
                Telefon: {{profile.PhoneNumber ?? "Brak"}}
                Email: {{profile.User?.Email ?? "Brak"}}
                O mnie: {{profile.AboutMe ?? "Brak"}}
                Lokalizacja: {{profile.Address ?? "Brak"}}, {{profile.Country}}
                Doświadczenie zawodowe:
                {{(
                    profile.WorkExperience != null
                        ? string.Join(
                            "\n",
                            profile.WorkExperience.Select(w =>
                                $"- {w.Position} w {w.Company}, od {w.StartDate:yyyy-MM-dd} do {(w.EndDate.HasValue ? w.EndDate.Value.ToString("yyyy-MM-dd") : "Obecnie")}"
                            )
                        )
                        : "Brak"
                )}}
                Wykształcenie:
                {{(
                    profile.Education != null
                        ? string.Join(
                            "\n",
                            profile.Education.Select(e =>
                                $"- {e.Degree} w {e.Field}, {e.Institution}, od {e.StartDate:yyyy-MM-dd} do {e.EndDate?.ToString("yyyy-MM-dd") ?? "Obecnie"}"
                            )
                        )
                        : "Brak"
                )}}
                Certyfikaty:
                {{(
                    profile.Certificates != null
                        ? string.Join(
                            "\n",
                            profile.Certificates.Select(c =>
                                $"- {c.Name}, {c.Date?.ToString("yyyy-MM-dd") ?? "Brak daty"}"
                            )
                        )
                        : "Brak"
                )}}
                Umiejętności: {{string.Join(", ", profile.Skills ?? new List<string>())}}
                Języki:
                {{(
                    profile.Languages != null
                        ? string.Join(
                            "\n",
                            profile.Languages.Select(l =>
                                $"- {l.Language}, poziom: {l.Level ?? "Brak"}"
                            )
                        )
                        : "Brak"
                )}}

                {{(
                    position != null
                        ? $"Wygeneruj CV dla stanowiska: {position}."
                        : "Wygeneruj ogólne CV."
                )}}

                Zwróć odpowiedź w formacie JSON zgodnym z następującą strukturą:
                {
                  "basics": {
                    "firstName": "",
                    "lastName": "",
                    "phoneNumber": "",
                    "email": "",
                    "summary": "",
                    "location": { "city": "", "country": "" }
                  },
                  "work": [
                    { "company": "", "position": "", "startDate": "", "endDate": "", "description": "" }
                  ],
                  "education": [
                    { "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "" }
                  ],
                  "certificates": [
                    { "name": "", "date": "" }
                  ],
                  "skills": [""],
                  "languages": [
                    { "language": "", "fluency": "" }
                  ]
                }

                Ważne:
                1. Wygeneruj dokładnie taki format JSON, wypełniając wszystkie pola sensownymi wartościami na podstawie danych użytkownika.
                2. Dostosuj CV do lokalizacji użytkownika ({{profile.Country}}).
                3. Zwróć tylko czysty JSON bez dodatkowych komentarzy.
                """;
        }

        public class CvGenerationException : Exception
        {
            public CvGenerationException(string message, Exception? inner)
                : base(message, inner) { }
        }
    }
}
