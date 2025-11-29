using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using VocareWebAPI.CareerAdvisor.Models.Dtos.MarketAnalysis;
using VocareWebAPI.CareerAdvisor.Models.Entities.MarketAnalysis;
using VocareWebAPI.CareerAdvisor.Repositories.Interfaces;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Dtos.MarketAnalysis;
using VocareWebAPI.Models.Entities.MarketAnalysis;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Repositories;
using VocareWebAPI.Repositories.Interfaces;

namespace VocareWebAPI.CareerAdvisor.Services.Implementations
{
    public class OpenAiMarketAnalysisService : IMarketAnalysisService
    {
        private readonly HttpClient _httpClient;
        private readonly OpenAIConfig _config;
        private readonly ICareerStatisticsRepository _careerStatisticsRepository;
        private readonly ISkillDemandRepository _skillDemandRepository;
        private readonly IMarketTrendsRepository _marketTrendsRepository;
        private readonly IAiRecommendationRepository _aiRecommendationRepository;
        private readonly ISalaryProgressionRepository _salaryProgressionRepository;
        private readonly IWorkAttributesRepository _workAttributesRepository;
        private readonly IEntryDifficultyRepository _entryDifficultyRepository;
        private readonly IAiNarratorRepository _aiNarratorRepository;
        private readonly ILogger<OpenAiMarketAnalysisService> _logger;

        public OpenAiMarketAnalysisService(
            HttpClient httpClient,
            IOptions<OpenAIConfig> config,
            ICareerStatisticsRepository careerStatisticsRepository,
            ISkillDemandRepository skillDemandRepository,
            IMarketTrendsRepository marketTrendsRepository,
            IAiRecommendationRepository aiRecommendationRepository,
            ILogger<OpenAiMarketAnalysisService> logger,
            ISalaryProgressionRepository salaryProgressionRepository,
            IWorkAttributesRepository workAttributesRepository,
            IEntryDifficultyRepository entryDifficultyRepository,
            IAiNarratorRepository aiNarratorRepository
        )
        {
            _httpClient = httpClient;
            _config = config.Value;
            _careerStatisticsRepository = careerStatisticsRepository;
            _skillDemandRepository = skillDemandRepository;
            _marketTrendsRepository = marketTrendsRepository;
            _aiRecommendationRepository = aiRecommendationRepository;
            _salaryProgressionRepository = salaryProgressionRepository;
            _workAttributesRepository = workAttributesRepository;
            _entryDifficultyRepository = entryDifficultyRepository;
            _aiNarratorRepository = aiNarratorRepository;
            _logger = logger;
        }

        public async Task<MarketAnalysisResponseDto> GetMarketAnalysisAsync(string userId)
        {
            var recommendation = await _aiRecommendationRepository.GetLatestByUserIdAsync(userId);
            if (recommendation == null)
                throw new Exception($"AI recommendation for user with ID {userId} not found.");

            if (recommendation.UserProfile == null)
                throw new Exception(
                    $"User profile for recommendation {recommendation.Id} not found."
                );

            var prompt = BuildPrompt(recommendation);

            var requestBody = new
            {
                model = _config.Model,
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content = "Jesteś ekspertem analuzy rynku pracy z wieloletnią widzą o trendach zatrudnienia. "
                            + "Twoje analizy są oparte na realnych danych statystycznych. "
                            + "Zawsze odpowiadasz w formacie JSON z konkretnymi wartościami liczbowymi.",
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
                _logger.LogInformation("OpenAI API Response: {responseContent}", responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                    {
                        if (responseContent.Contains("insufficient_quota"))
                        {
                            throw new Exception(
                                "Not enough money on OpenAI account to perform this operation."
                            );
                        }
                    }
                    throw new Exception(
                        $"API returner error: {response.StatusCode} - {responseContent}"
                    );
                }
                var apiResponse = JsonSerializer.Deserialize<OpenAiResponse>(
                    responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );
                if (
                    apiResponse?.Choices == null
                    || apiResponse.Choices.Count == 0
                    || apiResponse.Choices[0].Message?.Content == null
                )
                {
                    throw new Exception("Invalid AI API response: missing content.");
                }

                var jsonContent = apiResponse.Choices[0].Message.Content;

                var result = JsonSerializer.Deserialize<MarketAnalysisResponseDto>(
                    jsonContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (result == null)
                {
                    throw new Exception("Failed to parse market analysis JSON.");
                }

                InitializeNullProperties(result);
                await SaveMarketAnalysisToDatabase(result, recommendation.Id);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while calling OpenAI API for market analysis.");
                throw new Exception("Error while generating market analysis.", ex);
            }
        }

        private string BuildPrompt(AiRecommendation recommendation)
        {
            return $$"""
                Jesteś analitykiem rynku pracy, który przekłada surowe dane na zrozumiałe wnioski dla osoby szukającej pracy. Twoim priorytetem jest uczciwość: nie zawyżaj stawek (podawaj realne widełki dla poziomu stanowiska z rekomendacji) i nie koloryzuj szans na zatrudnienie. Twoje analizy mają pomóc użytkownikowi podjąć świadomą decyzję o ścieżce kariery.

                Rekomendowane ścieżki kariery:
                {{string.Join(", ", recommendation.CareerPaths.Select(cp => cp.CareerName))}}

                Uzasadnienie rekomendacji:
                {{recommendation.Justification}}

                Długoterminowy cel użytkownika:
                {{recommendation.LongTermGoal}}

                Zaplanowane kolejne kroki:
                {{string.Join(", ", recommendation.NextSteps.Select(ns => ns.Step))}}

                Lokalizacja użytkownika:
                {{recommendation.UserProfile.Country}}, {{recommendation.UserProfile.Address}}

                Wygeneruj SZCZEGÓŁOWĄ analizę rynku pracy w formacie JSON (język polski):

                {
                "marketAnalysis": {
                    "industryStatistics": [
                    {
                        "industry": "Nazwa branży",
                        "minSalary": 6000,
                        "maxSalary": 18000,
                        "employmentRate": 85,
                        "growthForecast": "Wysoki wzrost - 15% rocznie",
                        
                        "salaryProgression": [
                        {
                            "careerLevel": "Junior",
                            "yearsOfExperience": "0-2",
                            "minSalary": 5000,
                            "maxSalary": 7000,
                            "averageSalary": 6000
                        },
                        {
                            "careerLevel": "Mid",
                            "yearsOfExperience": "2-5",
                            "minSalary": 8000,
                            "maxSalary": 12000,
                            "averageSalary": 10000
                        },
                        {
                            "careerLevel": "Senior",
                            "yearsOfExperience": "5-8",
                            "minSalary": 12000,
                            "maxSalary": 18000,
                            "averageSalary": 15000
                        },
                        {
                            "careerLevel": "Lead/Expert",
                            "yearsOfExperience": "8+",
                            "minSalary": 18000,
                            "maxSalary": 30000,
                            "averageSalary": 24000
                        }
                        ],
                        
                        "workAttributes": {
                        "stressLevel": 7,
                        "analyticalThinking": 9,
                        "creativity": 6,
                        "teamwork": 8,
                        "independence": 7,
                        "routineVsDynamic": 8,
                        "customerFacing": 4,
                        "technicalDepth": 9
                        },
                        
                        "entryDifficulty": {
                        "difficultyScore": 65,
                        "difficultyLevel": "Średnie",
                        "missingSkillsCount": 2,
                        "missingSkills": ["React", "TypeScript"],
                        "matchingSkillsCount": 5,
                        "estimatedTimeToReady": "3-6 miesięcy",
                        "explanation": "Masz solidne podstawy w programowaniu, ale brakuje Ci znajomości nowoczesnych frameworków frontendowych. Po 3-6 miesiącach intensywnej nauki będziesz gotowy na pierwsze aplikacje."
                        },
                        
                        "aiNarrator": {
                        "salaryInsight": "Widzę, że początkowe zarobki na poziomie Junior (5000-7000 PLN) mogą wydawać się skromne, ale ta ścieżka ma jedną z najszybszych progresji w branży IT. Już po 2-3 latach możesz zarabiać dwukrotnie więcej, a doświadczeni specjaliści osiągają 15000-18000 PLN. To inwestycja, która naprawdę się opłaca.",
                        
                        "workStyleInsight": "Ten zawód wymaga wysokiego poziomu myślenia analitycznego (9/10) i oferuje sporą dynamikę pracy (8/10). Będziesz mieć przestrzeń na samodzielną pracę (7/10), ale również wiele okazji do współpracy zespołowej (8/10). Poziom stresu jest umiarkowany (7/10), co oznacza challenging work, ale z możliwością zarządzania obciążeniem.",
                        
                        "entryAdvice": "Twój profil pasuje do tej ścieżki w 75%. Widzę, że masz {{recommendation.UserProfile.Skills.Count}} umiejętności z listy wymaganych, co jest bardzo dobrym startem. Aby zwiększyć swoje szanse w tej branży, skoncentruj się na zdobyciu 2-3 brakujących umiejętności w ciągu najbliższych 3-6 miesięcy. Polecam kursy online i projekty osobiste - to najszybsza droga do pierwszej pracy.",
                        
                        "motivationalMessage": "Pamiętaj - każdy ekspert w tej branży kiedyś był początkującym. Twoje obecne umiejętności w {{string.Join(
                    ", ",
                    recommendation.UserProfile.Skills.Take(3)
                )}} to solidna podstawa. Rynek pracy w {{recommendation.UserProfile.Country}} jest bardzo przyjazny dla osób wchodzących do tej branży. Nie bój się aplikować nawet jeśli nie spełniasz 100%% wymagań - większość pracodawców stawia na potencjał i chęć rozwoju.",
                        
                        "personalizedRecommendation": "Na podstawie Twojego profilu, widzę że ta branża oferuje najlepsze perspektywy. {{(
                    recommendation.UserProfile.WorkExperience?.Any() == true
                        ? "Twoje doświadczenie w "
                            + recommendation.UserProfile.WorkExperience.First().Position
                            + " będzie dodatkowym atutem."
                        : "Brak doświadczenia nie jest przeszkodą - wiele firm szuka właśnie osób z Twoim profilem."
                )}} Ta ścieżka pozwoli Ci wykorzystać Twoje mocne strony."
                        }
                    }
                    ],
                    
                    "skillDemand": [
                    {
                        "skill": "Nazwa umiejętności",
                        "demandLevel": "bardzo wysoki",
                        "industry": "IT"
                    }
                    ],
                    
                    "marketTrends": [
                    {
                        "trendName": "Nazwa trendu",
                        "description": "Szczegółowy opis trendu",
                        "impact": "Konkretny wpływ na kandydatów"
                    }
                    ]
                }
                }
                 KLUCZOWE WYMAGANIA:

                1. SALARY PROGRESSION - Wygeneruj REALISTYCZNE zarobki dla 4 poziomów
                2. WORK ATTRIBUTES - Oceń każdy atrybut w skali 0-10
                3. ENTRY DIFFICULTY - Oblicz trudność na podstawie porównania umiejętności
                4. AI NARRATOR - Spersonalizowane, empatyczne komentarze
                5. Min 3 branże, 5 umiejętności, 3 trendy

                WYMAGANIA:
                1. Wygeneruj dokładnie taki format JSON z danymi dla:
                   - CO NAJMNIEJ 3 branż powiązanych z rekomendowanymi ścieżkami
                   - CO NAJMNIEJ 5 umiejętności związanych z rekomendowanymi ścieżkami
                   - CO NAJMNIEJ 3 trendy rynkowe istotne dla rekomendowanych ścieżek

                2. Wszystkie dane muszą być:
                   - Realistyczne i oparte na aktualnej wiedzy o rynku pracy
                   - Dostosowane do lokalizacji użytkownika ({{recommendation.UserProfile.Country}})
                   - Spójne z rekomendowanymi ścieżkami kariery
                   - Konkretne (używaj liczb, procentów, konkretnych prognoz)

                3. Dla statystyk branżowych:
                   - employmentRate: Traktuj to jako "Wskaźnik łatwości wejścia". 100 = biorą każdego chętnego, 20 = bardzo duża konkurencja, trudno o pierwszą pracę. Dostosuj tę liczbę do poziomu Junior/Mid/Senior wynikającego z rekomendacji.
                   - Wynagrodzenia w PLN (brutto miesięcznie) minSalary/maxSalary: MUSZĄ dotyczyć poziomu stanowiska z rekomendacji. Jeśli rekomendacja to "Młodszy Specjalista", podaj stawki dla juniora, a nie średnią rynkową dla seniorów.
                   - growthForecast: Unikaj korpo-bełkotu. Napisz prosto, np. "Stabilnie, ale mało nowych rekrutacji" zamiast "Saturacja rynku na poziomie ujemnym".

                4. Dla umiejętności:
                   - Używaj dokładnie skali: niski/średni/wysoki/bardzo wysoki
                   - Przypisz do konkretnej branży

                5. Dla trendów:
                   - Skup się na trendach rekrutacyjnych, a nie tylko technologicznych (np. "Wydłużone procesy rekrutacyjne", "Wymagane portfolio", "Powrót do biur").
                   - W polu impact napisz, co to oznacza dla kandydata (np. "Będziesz musiał wysłać 2x więcej CV niż rok temu" zamiast "Wzrost konkurencyjności o 15%").

                WAŻNE: Zwróć TYLKO czysty JSON bez żadnych dodatkowych objaśnień, komentarzy czy tekstu.
                Pamiętaj: odpowiedź musi być w języku polskim i zawierać realistyczne dane rynkowe(wszystkie teksty, nazwy, opisy po polsku).
                """;
        }

        public async Task<MarketAnalysisResponseDto> GetLatestMarketAnalysisAsync(string userId)
        {
            var recommendation = await _aiRecommendationRepository.GetLatestByUserIdAsync(userId);
            if (recommendation == null)
            {
                throw new Exception($"AI recommendation for user with ID:{userId} not found.");
            }

            var careerStats = await _careerStatisticsRepository.GetByAiRecommendationIdAsync(
                recommendation.Id
            );
            var skillDemands = await _skillDemandRepository.GetByAiRecommendationIdAsync(
                recommendation.Id
            );
            var marketTrends = await _marketTrendsRepository.GetByAiRecommendationIdAsync(
                recommendation.Id
            );

            var result = new MarketAnalysisResponseDto
            {
                MarketAnalysis = new MarketAnalysisDetailsDto
                {
                    IndustryStatistics = new List<IndustryStatisticsDto>(),
                    SkillDemand = skillDemands
                        .Select(sd => new SkillDemandDto
                        {
                            Skill = sd.SkillName,
                            DemandLevel = sd.DemandLevel,
                            Industry = sd.Industry,
                        })
                        .ToList(),
                    MarketTrends = marketTrends
                        .Select(mt => new MarketTrendsDto
                        {
                            TrendName = mt.TrendName,
                            Description = mt.Description,
                            Impact = mt.Impact,
                        })
                        .ToList(),
                },
            };

            foreach (var careerStat in careerStats)
            {
                var salaryProgressions =
                    await _salaryProgressionRepository.GetByCareerStatisticsIdAsync(careerStat.Id);
                var workAttributes = await _workAttributesRepository.GetByCareerStatisticsIdAsync(
                    careerStat.Id
                );
                var entryDifficulty = await _entryDifficultyRepository.GetByCareerStatisticsIdAsync(
                    careerStat.Id
                );
                var aiNarrator = await _aiNarratorRepository.GetByCareerStatisticsIdAsync(
                    careerStat.Id
                );

                var industryStat = new IndustryStatisticsDto
                {
                    Industry = careerStat.CareerName,
                    MinSalary = (int)careerStat.AverageSalaryMin,
                    MaxSalary = (int)careerStat.AverageSalaryMax,
                    EmploymentRate = careerStat.EmploymentRate,
                    GrowthForecast = careerStat.GrowthForecast,

                    // ✅ DODANE - Nowe dane
                    SalaryProgression = salaryProgressions
                        .Select(sp => new SalaryProgressionDto
                        {
                            CareerLevel = sp.CareerLevel,
                            YearsOfExperience = sp.YearsOfExperience,
                            MinSalary = sp.MinSalary,
                            MaxSalary = sp.MaxSalary,
                            AverageSalary = sp.AverageSalary,
                        })
                        .ToList(),

                    WorkAttributes =
                        workAttributes != null
                            ? new WorkAttributesDto
                            {
                                StressLevel = workAttributes.StressLevel,
                                AnalyticalThinking = workAttributes.AnalyticalThinking,
                                Creativity = workAttributes.Creativity,
                                Teamwork = workAttributes.Teamwork,
                                Independence = workAttributes.Independence,
                                RoutineVsDynamic = workAttributes.RoutineVsDynamic,
                                CustomerFacing = workAttributes.CustomerFacing,
                                TechnicalDepth = workAttributes.TechnicalDepth,
                            }
                            : new WorkAttributesDto(),

                    EntryDifficulty =
                        entryDifficulty != null
                            ? new EntryDifficultyDto
                            {
                                DifficultyScore = entryDifficulty.DifficultyScore,
                                DifficultyLevel = entryDifficulty.DifficultyLevel,
                                MissingSkillsCount = entryDifficulty.MissingSkillsCount,
                                MissingSkills = entryDifficulty.MissingSkills,
                                MatchingSkillsCount = entryDifficulty.MatchingSkillsCount,
                                EstimatedTimeToReady = entryDifficulty.EstimatedTimeToReady,
                                Explanation = entryDifficulty.Explanation,
                            }
                            : new EntryDifficultyDto(),

                    AiNarrator =
                        aiNarrator != null
                            ? new AiNarratorDto
                            {
                                SalaryInsight = aiNarrator.SalaryInsight,
                                WorkStyleInsight = aiNarrator.WorkStyleInsight,
                                EntryAdvice = aiNarrator.EntryAdvice,
                                MotivationalMessage = aiNarrator.MotivationalMessage,
                                PersonalizedRecommendation = aiNarrator.PersonalizedRecommendation,
                            }
                            : new AiNarratorDto(),
                };

                result.MarketAnalysis.IndustryStatistics.Add(industryStat);
            }

            InitializeNullProperties(result);
            return result;
        }

        private async Task SaveMarketAnalysisToDatabase(
            MarketAnalysisResponseDto analysis,
            Guid aiRecommendationId
        )
        {
            await _careerStatisticsRepository.DeleteByAiRecommendationIdAsync(aiRecommendationId);
            await _skillDemandRepository.DeleteByAiRecommendationIdAsync(aiRecommendationId);
            await _marketTrendsRepository.DeleteByAiRecommendationIdAsync(aiRecommendationId);

            try
            {
                foreach (var industryStat in analysis.MarketAnalysis.IndustryStatistics)
                {
                    var careerStatId = Guid.NewGuid();

                    var careerStat = new CareerStatistics
                    {
                        Id = careerStatId,
                        CareerName = industryStat.Industry,
                        AverageSalaryMin = industryStat.MinSalary,
                        AverageSalaryMax = industryStat.MaxSalary,
                        EmploymentRate = industryStat.EmploymentRate,
                        GrowthForecast = industryStat.GrowthForecast,
                        LastUpdated = DateTime.UtcNow,
                        AiRecommendationId = aiRecommendationId,
                    };
                    await _careerStatisticsRepository.AddAsync(careerStat);

                    foreach (var progression in industryStat.SalaryProgression)
                    {
                        var salaryProg = new SalaryProgression
                        {
                            Id = Guid.NewGuid(),
                            CareerLevel = progression.CareerLevel,
                            YearsOfExperience = progression.YearsOfExperience,
                            MinSalary = progression.MinSalary,
                            MaxSalary = progression.MaxSalary,
                            AverageSalary = progression.AverageSalary,
                            CareerStatisticsId = careerStatId,
                        };
                        await _salaryProgressionRepository.AddAsync(salaryProg);
                    }

                    if (industryStat.WorkAttributes != null)
                    {
                        var workAttr = new WorkAttributes
                        {
                            Id = Guid.NewGuid(),
                            StressLevel = industryStat.WorkAttributes.StressLevel,
                            AnalyticalThinking = industryStat.WorkAttributes.AnalyticalThinking,
                            Creativity = industryStat.WorkAttributes.Creativity,
                            Teamwork = industryStat.WorkAttributes.Teamwork,
                            Independence = industryStat.WorkAttributes.Independence,
                            RoutineVsDynamic = industryStat.WorkAttributes.RoutineVsDynamic,
                            CustomerFacing = industryStat.WorkAttributes.CustomerFacing,
                            TechnicalDepth = industryStat.WorkAttributes.TechnicalDepth,
                            CareerStatisticsId = careerStatId,
                        };
                        await _workAttributesRepository.AddAsync(workAttr);
                    }

                    if (industryStat.EntryDifficulty != null)
                    {
                        var entryDiff = new EntryDifficulty
                        {
                            Id = Guid.NewGuid(),
                            DifficultyScore = industryStat.EntryDifficulty.DifficultyScore,
                            DifficultyLevel = industryStat.EntryDifficulty.DifficultyLevel,
                            MissingSkillsCount = industryStat.EntryDifficulty.MissingSkillsCount,
                            MissingSkills = industryStat.EntryDifficulty.MissingSkills,
                            MatchingSkillsCount = industryStat.EntryDifficulty.MatchingSkillsCount,
                            EstimatedTimeToReady = industryStat
                                .EntryDifficulty
                                .EstimatedTimeToReady,
                            Explanation = industryStat.EntryDifficulty.Explanation,
                            CareerStatisticsId = careerStatId,
                        };
                        await _entryDifficultyRepository.AddAsync(entryDiff);
                    }

                    if (industryStat.AiNarrator != null)
                    {
                        var narrator = new AiNarrator
                        {
                            Id = Guid.NewGuid(),
                            SalaryInsight = industryStat.AiNarrator.SalaryInsight,
                            WorkStyleInsight = industryStat.AiNarrator.WorkStyleInsight,
                            EntryAdvice = industryStat.AiNarrator.EntryAdvice,
                            MotivationalMessage = industryStat.AiNarrator.MotivationalMessage,
                            PersonalizedRecommendation = industryStat
                                .AiNarrator
                                .PersonalizedRecommendation,
                            CareerStatisticsId = careerStatId,
                        };
                        await _aiNarratorRepository.AddAsync(narrator);
                    }
                }

                // ✅ SkillDemand i MarketTrends pozostają BEZ ZMIAN
                foreach (var skill in analysis.MarketAnalysis.SkillDemand)
                {
                    var skillDemand = new SkillDemand
                    {
                        Id = Guid.NewGuid(),
                        SkillName = skill.Skill,
                        Industry = skill.Industry,
                        DemandLevel = skill.DemandLevel,
                        LastUpdated = DateTime.UtcNow,
                        AiRecommendationId = aiRecommendationId,
                    };
                    await _skillDemandRepository.AddAsync(skillDemand);
                }

                foreach (var trend in analysis.MarketAnalysis.MarketTrends)
                {
                    var marketTrend = new MarketTrends
                    {
                        Id = Guid.NewGuid(),
                        TrendName = trend.TrendName,
                        Description = trend.Description,
                        Impact = trend.Impact,
                        StartDate = DateTime.UtcNow,
                        EndDate = null,
                        AiRecommendationId = aiRecommendationId,
                    };
                    await _marketTrendsRepository.AddAsync(marketTrend);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while saving market analysis to database");
                throw;
            }
        }

        private void InitializeNullProperties(MarketAnalysisResponseDto response)
        {
            response.MarketAnalysis ??= new MarketAnalysisDetailsDto();
            response.MarketAnalysis.IndustryStatistics ??= new List<IndustryStatisticsDto>();
            response.MarketAnalysis.SkillDemand ??= new List<SkillDemandDto>();
            response.MarketAnalysis.MarketTrends ??= new List<MarketTrendsDto>();

            foreach (var stat in response.MarketAnalysis.IndustryStatistics)
            {
                stat.SalaryProgression ??= new List<SalaryProgressionDto>();
                stat.WorkAttributes ??= new WorkAttributesDto();
                stat.EntryDifficulty ??= new EntryDifficultyDto();
                stat.AiNarrator ??= new AiNarratorDto();

                if (stat.EntryDifficulty.MissingSkills == null)
                {
                    stat.EntryDifficulty.MissingSkills = new List<string>();
                }
            }
        }

        public class MarketAnalysisException : Exception
        {
            public MarketAnalysisException(string message, Exception inner)
                : base(message, inner) { }
        }
    }
}
