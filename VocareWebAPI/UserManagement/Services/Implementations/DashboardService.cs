using System.Text.Json;
using Microsoft.Extensions.Options;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Repositories;
using VocareWebAPI.Shared.Exceptions;
using VocareWebAPI.UserManagement.Exceptions;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Services.Implementations
{
    public class DashboardService : IDashboardService
    {
        private readonly HttpClient _httpClient;
        private readonly OpenAIConfig _config;
        private readonly IDashboardRepository _dashboardRepository;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IProfileAttributesRepository _profileAttributesRepository;

        public DashboardService(
            IDashboardRepository dashboardRepository,
            IUserProfileRepository userProfileRepository,
            IProfileAttributesRepository profileAttributesRepository,
            HttpClient httpClient,
            IOptions<OpenAIConfig> config
        )
        {
            _dashboardRepository = dashboardRepository;
            _userProfileRepository = userProfileRepository;
            _profileAttributesRepository = profileAttributesRepository;
            _httpClient = httpClient;
            _config = config.Value;

            _httpClient.Timeout = TimeSpan.FromSeconds(180);
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            var recommendationsTask = await _dashboardRepository.GetRecommendationsCountAsync(
                userId
            );
            var analysesTask = await _dashboardRepository.GetAnalysesCountAsync(userId);
            var roadmapsTask = await _dashboardRepository.GetRoadmapsCountAsync(userId);
            var cvsTask = await _dashboardRepository.GetCvsCountAsync(userId);
            var profileTask = await _userProfileRepository.GetUserProfileByIdAsync(userId);
            var financialTask = await _dashboardRepository.GetFinancialSurveyAsync(userId);

            var profile = profileTask;
            var financial = financialTask;

            var completion = CalculateProfileCompletionPercentage(profile);
            var salary = CalculateSalaryProgress(financial);

            return new DashboardSummaryDto
            {
                RecommendationsCount = recommendationsTask,
                AnalysisCount = analysesTask,
                RoadmapsCount = roadmapsTask,
                CvsCount = cvsTask,
                ProfileCompletionPercentage = completion,
                salaryProgressDto = salary,
            };
        }

        public async Task<ProfileAttributesDto> GetProfileAttributesAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            var profile = await _userProfileRepository.GetUserProfileByIdAsync(userId);

            var attributes = await _profileAttributesRepository.GetByUserIdAsync(userId);

            if (attributes != null)
            {
                return new ProfileAttributesDto
                {
                    PracticalExperience = attributes.PracticalExperience,
                    HardCompetencies = attributes.HardCompetencies,
                    Creativity = attributes.Creativity,
                    Teamwork = attributes.Teamwork,
                    Independence = attributes.Independence,
                    SoftCompetencies = attributes.SoftCompetencies,
                    Certification = attributes.Certification,
                    TechnicalSkills = attributes.TechnicalSkills,
                };
            }
            else
            {
                var prompt = BuildPrompt(profile);

                var requestBody = new
                {
                    model = _config.Model,
                    messages = new[]
                    {
                        new
                        {
                            role = "system",
                            content = "Jesteś ekspertem doradztwa zawodowego z wieloletnim doświadczeniem. "
                                + "Twoje analizy są oparte na aktualnych trendach rynkowych i realnych danych. "
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
                        throw new AiServiceException(
                            $"OpenAI API error: {response.StatusCode} - {responseContent}"
                        );
                    }

                    var apiResponse = JsonSerializer.Deserialize<OpenAiResponse>(
                        responseContent,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                    );

                    if (apiResponse?.Choices == null || apiResponse.Choices.Count == 0)
                        throw new AiServiceException("Invalid API response: missing choices.");

                    var content = apiResponse.Choices[0].Message?.Content;
                    if (string.IsNullOrWhiteSpace(content))
                        throw new AiServiceException("Invalid API response: empty content.");

                    //Parsowanie JSON z odpowiedzi OpenAI
                    var result = JsonSerializer.Deserialize<ProfileAttributesDto>(
                        content,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                    );

                    if (result == null)
                        throw new AiServiceException(
                            "Failed to parse career recommendations from JSON"
                        );

                    attributes = new ProfileAttributes
                    {
                        Id = Guid.NewGuid(),
                        PracticalExperience = result.PracticalExperience,
                        HardCompetencies = result.HardCompetencies,
                        Creativity = result.Creativity,
                        Teamwork = result.Teamwork,
                        Independence = result.Independence,
                        SoftCompetencies = result.SoftCompetencies,
                        Certification = result.Certification,
                        TechnicalSkills = result.TechnicalSkills,
                        UserId = userId,
                        GeneratedAt = DateTime.UtcNow,
                    };

                    await _profileAttributesRepository.SaveAsync(attributes);
                    return result;
                }
                catch (HttpRequestException e)
                {
                    throw new AiServiceException("Błąd komunikacji z API", e);
                }
            }
        }

        private int CalculateProfileCompletionPercentage(UserProfile profile)
        {
            int totalFields = 15;
            int completedField = 0;

            if (profile == null)
                return 0;

            if (!string.IsNullOrEmpty(profile.FirstName))
                completedField++;

            if (!string.IsNullOrEmpty(profile.LastName))
                completedField++;

            if (!string.IsNullOrEmpty(profile.Country))
                completedField++;

            if (!string.IsNullOrEmpty(profile.Address))
                completedField++;

            if (!string.IsNullOrEmpty(profile.PhoneNumber))
                completedField++;

            if (profile.Education != null && profile.Education.Count > 0)
                completedField++;

            if (profile.WorkExperience != null && profile.WorkExperience.Count > 0)
                completedField++;

            if (profile.Skills != null && profile.Skills.Count > 0)
                completedField++;

            if (profile.SoftSkills != null && profile.SoftSkills.Count > 0)
                completedField++;

            if (profile.Certificates != null && profile.Certificates.Count > 0)
                completedField++;

            if (profile.Languages != null && profile.Languages.Count > 0)
                completedField++;

            if (!string.IsNullOrEmpty(profile.AboutMe))
                completedField++;

            if (!string.IsNullOrEmpty(profile.AdditionalInformation))
                completedField++;

            if (profile.PersonalityType != Models.Enums.PersonalityType.Unknown)
                completedField++;

            if (profile.FinancialSurvey != null)
                completedField++;

            return (int)((double)completedField / totalFields * 100);
        }

        private SalaryProgressDto CalculateSalaryProgress(FinancialSurvey? survey)
        {
            if (survey == null)
            return new SalaryProgressDto
            {
                CurrentSalary = 0,
                ExpectedSalary = 0,
                GoalCompletionPercentage = 0,
            };

            var currentSalary = survey.CurrentSalary ?? 0;
            var targetSalary = survey.DesiredSalary ?? 0;

            var progressPercentage = 0.0;
            if (currentSalary != 0 && targetSalary != 0)
                progressPercentage = (double)currentSalary / (double)targetSalary * 100;

            return new SalaryProgressDto
            {
                CurrentSalary = currentSalary,
                ExpectedSalary = targetSalary,
                GoalCompletionPercentage = (int)progressPercentage,
            };
        }

        private string BuildPrompt(UserProfile profile)
        {
            return $$"""
                Na podstawie poniższego profilu użytkownika oceń go w 8 kategoriach zawodowych. Każda kategoria musi otrzymać wartość liczbową od 0 do 100, gdzie 0 oznacza brak kompetencji, a 100 oznacza eksperta.

                Profil użytkownika:
                - Imię i nazwisko: {{profile.FirstName}} {{profile.LastName}}
                - Umiejętności techniczne: {{string.Join(", ", profile.Skills)}}
                - Umiejętności miękkie: {{string.Join(", ", profile.SoftSkills)}}
                - Doświadczenie zawodowe:
                {{(profile.WorkExperience != null && profile.WorkExperience.Any()
                    ? string.Join("\n", profile.WorkExperience.Select(w =>
                        $"  - {w.Position} w {w.Company} ({w.StartDate:yyyy-MM-dd} - {(w.EndDate?.ToString("yyyy-MM-dd") ?? "obecnie")}): {w.Description}"))
                    : "Brak doświadczenia zawodowego")}}
                - Wykształcenie:
                {{(profile.Education != null && profile.Education.Any()
                    ? string.Join("\n", profile.Education.Select(e =>
                        $"  - {e.Degree} w {e.Field}, {e.Institution}"))
                    : "Brak wykształcenia")}}
                - Certyfikaty:
                {{(profile.Certificates != null && profile.Certificates.Any()
                    ? string.Join("\n", profile.Certificates.Select(c =>
                        $"  - {c.Name} (wydany przez {c.Issuer ?? "brak wydawcy"})"))
                    : "Brak certyfikatów")}}
                - Języki: {{(profile.Languages != null && profile.Languages.Any()
                    ? string.Join(", ", profile.Languages.Select(l => $"{l.Language} ({l.Level})"))
                    : "Brak języków")}}
                - Typ osobowości: {{profile.PersonalityType}}

                Oceń profil w następujących kategoriach:
                1. practicalExperience - Doświadczenie praktyczne: ocena na podstawie ilości i jakości doświadczenia zawodowego
                2. hardCompetencies - Kompetencje twarde: ocena na podstawie umiejętności technicznych i ich różnorodności
                3. creativity - Kreatywność: ocena na podstawie profilu osobowości, opisów stanowisk i umiejętności miękkich
                4. teamwork - Zespół: ocena zdolności do pracy zespołowej na podstawie doświadczenia i umiejętności miękkich
                5. independence - Samodzielność: ocena zdolności do samodzielnej pracy
                6. softCompetencies - Kompetencje miękkie: ocena na podstawie zadeklarowanych umiejętności miękkich
                7. certification - Certyfikacja: ocena na podstawie posiadanych certyfikatów i wykształcenia
                8. technicalSkills - Umiejętności techniczne: ocena głębokości wiedzy technicznej

                Zwróć WYŁĄCZNIE czysty JSON bez żadnych dodatkowych komentarzy:
                {
                    "practicalExperience": 75,
                    "hardCompetencies": 60,
                    "creativity": 45,
                    "teamwork": 80,
                    "independence": 70,
                    "softCompetencies": 55,
                    "certification": 30,
                    "technicalSkills": 65
                }

                WAŻNE:
                - Wartości muszą być liczbami całkowitymi od 0 do 100
                - Bądź realistyczny w ocenach - osoba bez doświadczenia nie powinna dostać wysokich ocen
                - Puste pola profilu oznaczają niższe oceny w powiązanych kategoriach
                """;
        }
    }
}
