using System.Text.Json;
using System.Text.Json.Serialization;
using AutoMapper;
using Microsoft.Extensions.Options;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Config;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.Services;

namespace VocareWebAPI.CareerAdvisor.Services.Implementations
{
    public class OpenAIService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly AiConfig _config;
        private readonly IAiRecommendationRepository _aiRecommendationRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<OpenAIService> _logger;

        public OpenAIService(
            HttpClient httpClient,
            IOptions<AiConfig> aiConfig,
            IAiRecommendationRepository aiRecommendationRepository,
            IMapper mapper,
            ILogger<OpenAIService> logger
        )
        {
            _httpClient = httpClient;
            _config = aiConfig.Value;
            _aiRecommendationRepository = aiRecommendationRepository;
            _mapper = mapper;
            _logger = logger;

            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<AiCareerResponseDto> GetCareerRecommendationsAsync(UserProfile profile)
        {
            var prompt = BuildPrompt(profile);
            var requestBody = new
            {
                model = _config.Model,
                messages = new[]
                {
                    new
                    {
                        role = "assistant",
                        content = "Jesteś ekspertem doradztwa zawodowego z wieloletnim doświadczeniem. "
                            + "Twoje analizy są oparte na aktualnych trendach rynkowych i realnych danych. "
                            + "Zawsze odpowiadasz w formacie JSON.",
                    },
                    new { role = "user", content = prompt },
                },
                response_format = new { type = "json_object" }, // Wymusza odpowiedź JSON
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
                        $"OpenAI API error: {response.StatusCode} - {responseContent}"
                    );
                }

                var apiResponse = JsonSerializer.Deserialize<OpenAiResponse>(
                    responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (apiResponse?.Choices == null || apiResponse.Choices.Count == 0)
                {
                    throw new AiServiceException("Invalid API response: missing choices.");
                }
                var content = apiResponse.Choices[0].Message?.Content;
                if (string.IsNullOrWhiteSpace(content))
                {
                    throw new AiServiceException("Invalid API response: empty content.");
                }

                //Parsowanie JSON z odpowiedzi OpenAI
                var result = JsonSerializer.Deserialize<AiCareerResponseDto>(
                    content,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (result == null)
                {
                    throw new AiServiceException(
                        "Failed to parse career recommendations from JSON"
                    );
                }
                // Inicjalizacja nullowych właściwości
                InitializeNullProperties(result);
                await SaveRecommendationToUserProfile(profile.UserId, result);

                return result;
            }
            catch (HttpRequestException e)
            {
                _logger.LogError(e, "Error communicating with OpenAI API");
                throw new AiServiceException("Błąd komunikacji z API", e);
            }
        }

        public async Task<AiCareerResponseDto> GetLastRecommendationAsync(string userId)
        {
            var recommendation = await _aiRecommendationRepository.GetLatestByUserIdAsync(userId);
            if (recommendation == null)
            {
                throw new AiServiceException("No recommendation found");
            }

            var dto = _mapper.Map<AiCareerResponseDto>(recommendation);
            dto.Recommendation = new FinalRecommendationDto
            {
                PrimaryPath = recommendation.PrimaryPath,
                Justification = recommendation.Justification,
                LongTermGoal = recommendation.LongTermGoal,
                NextSteps = recommendation.NextSteps.Select(ns => ns.Step).ToList(),
            };
            return dto;
        }

        private async Task SaveRecommendationToUserProfile(
            string userId,
            AiCareerResponseDto recommendation
        )
        {
            try
            {
                var recommendationEntity = _mapper.Map<AiRecommendation>(recommendation);
                recommendationEntity.UserId = userId;
                recommendationEntity.RecommendationDate = DateTime.UtcNow;

                await _aiRecommendationRepository.AddRecommendationAsync(recommendationEntity);
                _logger.LogInformation($"Saved recommendation for user: {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving recommendation for user: {userId}");
                throw;
            }
        }

        private void InitializeNullProperties(AiCareerResponseDto response)
        {
            if (response.CareerPaths == null)
            {
                response.CareerPaths = new List<CareerPathDto>();
            }
            if (response.Recommendation == null)
            {
                response.Recommendation = new FinalRecommendationDto();
            }
            foreach (var path in response.CareerPaths)
            {
                path.RequiredSkills ??= new List<string>();
                path.MarketAnalysis ??= new List<string>();
                path.RecommendedCourses ??= new List<string>();
                if (path.SwotAnalysis == null)
                {
                    path.SwotAnalysis = new SwotAnalysisDto
                    {
                        Strengths = new List<string>(),
                        Weaknesses = new List<string>(),
                        Opportunities = new List<string>(),
                        Threats = new List<string>(),
                    };
                }
                else
                {
                    path.SwotAnalysis.Strengths ??= new List<string>();
                    path.SwotAnalysis.Weaknesses ??= new List<string>();
                    path.SwotAnalysis.Opportunities ??= new List<string>();
                    path.SwotAnalysis.Threats ??= new List<string>();
                }
            }
            response.Recommendation.NextSteps ??= new List<string>();
        }

        private string BuildPrompt(UserProfile profile)
        {
            return $$"""
                Jesteś doradcą zawodowym analizującym profil użytkownika. Bazuj na aktualnych trendach rynku pracy w {{DateTime.Now.Year}} roku.
                
                Profil użytkownika:
                - Imię: {{profile.FirstName}} {{profile.LastName}}
                - Umiejętności: {{string.Join(", ", profile.Skills)}},
                - Umiejętności miękkie: {{string.Join(", ", profile.SoftSkills)}},
                - Doświadczenie zawodowe:
                {{(profile.WorkExperience != null ? string.Join("\n", profile.WorkExperience.Select(w =>
                    $"- {w.Position} w {w.Company} (od {w.StartDate:yyyy-MM-dd} do {(w.EndDate.HasValue ? w.EndDate.Value.ToString("yyyy-MM-dd") : "obecnie")}): {w.Description}"))
                    : "Brak doświadczenia zawodowego")}}
                - Wymagania finansowe:
                {{(profile.FinancialSurvey != null
                    ? $"Aktualne zarobki {profile.FinancialSurvey.CurrentSalary} PLN, oczekiwane {profile.FinancialSurvey.DesiredSalary} PLN"
                    : "Brak danych finansowych")}}
                - Wykształcenie:
                {{(profile.Education != null && profile.Education.Any()
                    ? string.Join("\n", profile.Education.Select(e =>
                        $"- {e.Degree} w {e.Field}, {e.Institution}"))
                    : "Brak wykształcenia")}}
                - Lokalizacja: {{profile.Country}}, {{profile.Address}}
                - Języki: {{string.Join(", ", profile.Languages.Select(l => $"{l.Language} ({l.Level})"))}}
                - Typ osobowości: {{profile.PersonalityType.ToString()}}
                - Czy gotów do przebranżowienia: {{profile.WillingToRebrand}}

                Na podstawie powyższych danych, wygeneruj dokładnie 3 rekomendacje ścieżek kariery.
                Wykorzystaj swoją wiedzę o aktualnym rynku pracy, trendach technologicznych i zapotrzebowaniu na specjalistów.
                
                Odpowiedz WYŁĄCZNIE w formacie JSON zgodnym z poniższą strukturą:
                {
                    "careerPaths": [
                        {
                            "careerName": "Nazwa stanowiska/ścieżki kariery",
                            "description": "Szczegółowy opis czym się zajmuje osoba na tym stanowisku",
                            "probability": 85,
                            "requiredSkills": ["umiejętność1", "umiejętność2", "umiejętność3"],
                            "marketAnalysis": [
                                "Średnie wynagrodzenie: X-Y PLN brutto",
                                "Zapotrzebowanie na rynku: wysokie/średnie/niskie",
                                "Liczba ofert pracy: około X miesięcznie"
                            ],
                            "recommendedCourses": [
                                "Nazwa kursu lub certyfikatu z platformy (np. Coursera, Udemy)",
                                "Kolejny przydatny kurs",
                                "Certyfikat branżowy"
                            ],
                            "swot": {
                                "strengths": ["Twoje mocne strony pasujące do tej ścieżki", "Kolejna mocna strona"],
                                "weaknesses": ["Obszar do rozwoju", "Brakująca umiejętność"],
                                "opportunities": ["Szansa rynkowa", "Trend wzrostowy"],
                                "threats": ["Potencjalne zagrożenie", "Konkurencja lub automatyzacja"]
                            }
                        }
                    ],
                    "recommendation": {
                        "primaryPath": "Nazwa najlepiej dopasowanej ścieżki",
                        "justification": "Szczegółowe uzasadnienie dlaczego ta ścieżka jest najlepsza dla użytkownika",
                        "nextSteps": [
                            "Konkretny pierwszy krok do podjęcia w ciągu tygodnia",
                            "Działanie do realizacji w ciągu miesiąca",
                            "Cel na najbliższe 3 miesiące",
                            "Plan rozwoju na pół roku"
                        ],
                        "longTermGoal": "Wizja kariery za 3-5 lat"
                    }
                }

                Pamiętaj: odpowiedź musi być w języku polskim i zawierać realistyczne dane rynkowe.
                """;
        }

        public class AiServiceException : Exception
        {
            public AiServiceException(string message)
                : base(message) { }

            public AiServiceException(string message, Exception inner)
                : base(message, inner) { }
        }
    }

    // Klasy pomocnicze dla odpowiedzi OpenAI
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
