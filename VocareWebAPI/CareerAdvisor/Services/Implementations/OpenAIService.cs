using System.Text.Json;
using System.Text.Json.Serialization;
using AutoMapper;
using Microsoft.Extensions.Options;
using VocareWebAPI.CareerAdvisor.Exceptions;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Repositories;
using VocareWebAPI.Services;
using VocareWebAPI.Shared.Exceptions;
using VocareWebAPI.Shared.Services.Interfaces;

namespace VocareWebAPI.CareerAdvisor.Services.Implementations
{
    public class OpenAIService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly OpenAIConfig _config;
        private readonly IAiRecommendationRepository _aiRecommendationRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<OpenAIService> _logger;
        private readonly IEmbeddingService _embeddingService;

        public OpenAIService(
            HttpClient httpClient,
            IOptions<OpenAIConfig> aiConfig,
            IAiRecommendationRepository aiRecommendationRepository,
            IMapper mapper,
            ILogger<OpenAIService> logger,
            IEmbeddingService embeddingService
        )
        {
            _httpClient = httpClient;
            _config = aiConfig.Value;
            _aiRecommendationRepository = aiRecommendationRepository;
            _mapper = mapper;
            _logger = logger;
            _embeddingService = embeddingService;

            _httpClient.Timeout = TimeSpan.FromSeconds(180);
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
                var result = JsonSerializer.Deserialize<AiCareerResponseDto>(
                    content,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (result == null)
                    throw new AiServiceException(
                        "Failed to parse career recommendations from JSON"
                    );

                // Inicjalizacja nullowych właściwości
                InitializeNullProperties(result);

                var savedEntity = await SaveRecommendationToUserProfile(profile.UserId, result);

                for (
                    int i = 0;
                    i < result.CareerPaths.Count && i < savedEntity.CareerPaths.Count;
                    i++
                )
                {
                    result.CareerPaths[i].Id = savedEntity.CareerPaths[i].Id;
                }

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
                throw new RecommendationNotFoundException(userId);

            var dto = new AiCareerResponseDto
            {
                CareerPaths = recommendation
                    .CareerPaths.Select(cp => new CareerPathDto
                    {
                        Id = cp.Id,
                        CareerName = cp.CareerName,
                        Description = cp.Description,
                        Probability = double.TryParse(cp.Probability, out var p) ? p : 0,
                        RequiredSkills = cp.RequiredSkills ?? new(),
                        MarketAnalysis = cp.MarketAnalysis ?? new(),
                        RecommendedCourses = cp.RecommendedCourses ?? new(),
                        SuggestedSeniority = cp.SuggestedSeniority,
                        AllowedJobCategories = cp.AllowedJobCategories ?? new(),
                        SwotAnalysis =
                            cp.SwotAnalysis != null
                                ? new SwotAnalysisDto
                                {
                                    Strengths = cp.SwotAnalysis.Strengths ?? new(),
                                    Weaknesses = cp.SwotAnalysis.Weaknesses ?? new(),
                                    Opportunities = cp.SwotAnalysis.Opportunities ?? new(),
                                    Threats = cp.SwotAnalysis.Threats ?? new(),
                                }
                                : new SwotAnalysisDto(),
                    })
                    .ToList(),
                Recommendation = new FinalRecommendationDto
                {
                    PrimaryPath = recommendation.PrimaryPath,
                    Justification = recommendation.Justification,
                    LongTermGoal = recommendation.LongTermGoal,
                    NextSteps = recommendation.NextSteps.Select(ns => ns.Step).ToList(),
                },
            };

            return dto;
        }

        private async Task<AiRecommendation> SaveRecommendationToUserProfile(
            string userId,
            AiCareerResponseDto recommendation
        )
        {
            var recommendationEntity = _mapper.Map<AiRecommendation>(recommendation);
            recommendationEntity.UserId = userId;
            recommendationEntity.RecommendationDate = DateTime.UtcNow;

            foreach (var careerPath in recommendationEntity.CareerPaths)
            {
                try
                {
                    var textForEmbedding = BuildCareerPathTextForEmbedding(careerPath);

                    _logger.LogDebug(
                        "Generuję embedding dla ściezki: {CareerName}",
                        careerPath.CareerName
                    );
                    careerPath.Embedding = await _embeddingService.GenerateEmbeddingAsync(
                        textForEmbedding
                    );

                    _logger.LogDebug(
                        "Wygenerowano embedding dla ścieżki: {CareerName}",
                        careerPath.CareerName
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Nie udało się wygenerować embeddingu dla ścieżki: {CareerName}. Kontynuuję bez embeddingu.",
                        careerPath.CareerName
                    ); // Nie blokujemy zapisu rekomendacji, kontynuujemy w razie błędu bez zpisu embeddingu
                }
            }

            await _aiRecommendationRepository.AddRecommendationAsync(recommendationEntity);
            _logger.LogInformation($"Saved recommendation for user: {userId}");

            return recommendationEntity;
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
                path.AllowedJobCategories ??= new List<string>();
                if (string.IsNullOrEmpty(path.SuggestedSeniority))
                {
                    path.SuggestedSeniority = "Mid";
                }
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
            Jesteś pragmatycznym mentorem kariery, który stawia na realizm i konkret. Twoim celem jest znalezienie "najbliższego logicznego kroku" dla użytkownika, a nie sprzedawanie marzeń. Używaj prostego, naturalnego języka (plain language), unikaj żargonu HR i korpo-mowy, chyba że jest to niezbędna nazwa techniczna.
            
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

            Na podstawie powyższych danych wygeneruj dokładnie 3 rekomendacje, stosując zasadę "Minimal Viable Transition":

            Dopasowanie Seniority: Jeśli użytkownik ma <2 lata doświadczenia, rekomenduj TYLKO stanowiska Junior/Entry-level. Jeśli zmienia branżę, również startuje od poziomu Junior. Nie sugeruj ról liderskich/managerskich osobom bez udokumentowanego doświadczenia w zarządzaniu ludźmi.

            Zrozumiałość: Opis stanowiska ma być zrozumiały dla laika – wyjaśnij, co ta osoba faktycznie robi przez 8 godzin w pracy.

            Realizm: Odrzuć ścieżki, które wymagają >6 miesięcy nauki przed podjęciem pierwszej pracy (chyba że użytkownik ma już solidne podstawy).

            WAŻNE - Kategorie ofert pracy:
            Dla każdej ścieżki kariery musisz określić w jakich kategoriach szukać ofert pracy.
            Dozwolone kategorie (wybierz 1-3 najlepiej pasujące):
            agile, architecture, artificialIntelligence, automation, backend, businessAnalyst, businessIntelligence, consulting, customerService, data, devops, electricalEng, electronics, embedded, erp, finance, frontend, fullstack, gameDev, hr, law, logistics, marketing, mechanics, mobile, officeAdministration, other, productManagement, projectManager, sales, security, support, sysAdministrator, telecommunication, testing, ux

            Używaj WYŁĄCZNIE kategorii z powyższej listy - bez modyfikacji, dokładnie tak jak są zapisane (camelCase).
            
            Odpowiedz WYŁĄCZNIE w formacie JSON zgodnym z poniższą strukturą:
            {
                "careerPaths": [
                    {
                        "careerName": "Nazwa stanowiska/ścieżki kariery",
                        "description": "Krótki i życiowy opis codziennych zadań (np. 'piszesz posty na FB', 'dzwonisz do klientów'), bez zbędnych ogólników",
                        "probability": 85,
                        "suggestedSeniority": "Junior",
                        "allowedJobCategories": ["customerService", "support"],
                        "requiredSkills": ["Excel", "SQL", "Figma"],
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
                    "justification": "Szczegółowe uzasadnienie dlaczego ta ścieżka jest najlepsza dla użytkownika tu i teraz, bazując na jego obecnych zasobach i rynku pracy",
                    "nextSteps": [
                        "Mikro-zadanie do wykonania w 15 minut (np. 'Zaktualizuj sekcję X w CV', 'Zapisz się na webinar Y') - nawias jest wyłącznie dla Ciebie, nie umieszczaj go w odpowiedzi",
                        "Działanie do realizacji w ciągu miesiąca",
                        "Cel na najbliższe 3 miesiące",
                        "Plan rozwoju na pół roku"
                    ],
                    "longTermGoal": "Wizja kariery za 3-5 lat"
                }
            }

            Zasady dla suggestedSeniority:
            - "Junior" - jeśli to przebranżowienie LUB użytkownik ma <2 lata doświadczenia w tej dziedzinie
            - "Mid" - jeśli użytkownik ma 2-5 lat doświadczenia w pokrewnej dziedzinie
            - "Senior" - TYLKO jeśli użytkownik ma >5 lat bezpośredniego doświadczenia w tej roli

            Zasady dla requiredSkills:
            - Używaj KRÓTKICH nazw narzędzi (1-2 słowa): "Excel", "SQL", "Figma", "Google Analytics"
            - NIE dodawaj szczegółów w nawiasach: "Excel" zamiast "Excel (tabele przestawne, VLOOKUP)"
            - NIE dodawaj poziomów: "Figma" zamiast "Figma (podstawy)"
            - Nazwy mają pasować do tego jak firmy piszą w ogłoszeniach o pracę
            
            Pamiętaj: odpowiedź musi być w języku polskim i zawierać realistyczne dane rynkowe.
            """;
        }

        private string BuildCareerPathTextForEmbedding(CareerPath careerPath)
        {
            var skills =
                careerPath.RequiredSkills != null && careerPath.RequiredSkills.Any()
                    ? string.Join(", ", careerPath.RequiredSkills)
                    : "";
            // Format: "Nazwa stanowiska. Opis. Wymagane umiejętosci: skill1, skill2
            var text = $"{careerPath.CareerName}. {careerPath.Description}";

            if (!string.IsNullOrEmpty(skills))
                text += $"Wymagane umiejętności: {skills}";

            return text;
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
