using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Config;
using VocareWebAPI.Models.Dtos.MarketAnalysis;
using VocareWebAPI.Models.Entities.MarketAnalysis;
using VocareWebAPI.Repositories;
using VocareWebAPI.Repositories.Interfaces;

namespace VocareWebAPI.CareerAdvisor.Services.Implementations
{
    public class OpenAiMarketAnalysisService : IMarketAnalysisService
    {
        private readonly HttpClient _httpClient;
        private readonly OpenAiConfig _config;
        private readonly ICareerStatisticsRepository _careerStatisticsRepository;
        private readonly ISkillDemandRepository _skillDemandRepository;
        private readonly IMarketTrendsRepository _marketTrendsRepository;
        private readonly IAiRecommendationRepository _aiRecommendationRepository;
        private readonly ILogger<OpenAiMarketAnalysisService> _logger;

        public OpenAiMarketAnalysisService(
            HttpClient httpClient,
            IOptions<OpenAiConfig> config,
            ICareerStatisticsRepository careerStatisticsRepository,
            ISkillDemandRepository skillDemandRepository,
            IMarketTrendsRepository marketTrendsRepository,
            IAiRecommendationRepository aiRecommendationRepository,
            ILogger<OpenAiMarketAnalysisService> logger
        )
        {
            _httpClient = httpClient;
            _config = config.Value;
            _careerStatisticsRepository = careerStatisticsRepository;
            _skillDemandRepository = skillDemandRepository;
            _marketTrendsRepository = marketTrendsRepository;
            _aiRecommendationRepository = aiRecommendationRepository;
            _logger = logger;

            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
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
                Jesteś ekspertem ds. analizy rynku pracy z aktualną wiedzą o trendach i statystykach zatrudnienia. 
                Na podstawie poniższych danych z rekomendacji zawodowych użytkownika, przygotuj szczegółową analizę rynku:

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

                Struktura JSON MUSI być dokładnie taka:
                {
                  "marketAnalysis": {
                    "industryStatistics": [
                      {
                        "industry": "Nazwa branży",
                        "minSalary": 8000,
                        "maxSalary": 12000,
                        "employmentRate": 85,
                        "growthForecast": "Prognoza wzrostu (np. Wysoki wzrost - 15% rocznie)"
                      }
                    ],
                    "skillDemand": [
                      {
                        "skill": "Nazwa umiejętności",
                        "demandLevel": "niski/średni/wysoki/bardzo wysoki",
                        "industry": "Branża"
                      }
                    ],
                    "marketTrends": [
                      {
                        "trendName": "Nazwa trendu",
                        "description": "Szczegółowy opis trendu i jak wpływa na rynek",
                        "impact": "Konkretny wpływ na kandydatów (np. Zwiększone zapotrzebowanie na specjalistów o 30%)"
                      }
                    ]
                  }
                }

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
                   - employmentRate: skala 0-100 (procent zatrudnienia w branży)
                   - Wynagrodzenia w PLN (brutto miesięcznie)
                   - growthForecast: opisowa prognoza z konkretnymi danymi

                4. Dla umiejętności:
                   - Używaj dokładnie skali: niski/średni/wysoki/bardzo wysoki
                   - Przypisz do konkretnej branży

                5. Dla trendów:
                   - Opisz rzeczywiste trendy wpływające na rynek
                   - Podaj konkretny, mierzalny wpływ

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
                    IndustryStatistics = careerStats
                        .Select(cs => new IndustryStatisticsDto
                        {
                            Industry = cs.CareerName,
                            MinSalary = (int)cs.AverageSalaryMin,
                            MaxSalary = (int)cs.AverageSalaryMax,
                            EmploymentRate = cs.EmploymentRate,
                            GrowthForecast = cs.GrowthForecast,
                        })
                        .ToList(),
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
                    var careerStat = new CareerStatistics
                    {
                        Id = Guid.NewGuid(),
                        CareerName = industryStat.Industry,
                        AverageSalaryMin = industryStat.MinSalary,
                        AverageSalaryMax = industryStat.MaxSalary,
                        EmploymentRate = industryStat.EmploymentRate,
                        GrowthForecast = industryStat.GrowthForecast,
                        LastUpdated = DateTime.UtcNow,
                        AiRecommendationId = aiRecommendationId,
                    };
                    await _careerStatisticsRepository.AddAsync(careerStat);
                }
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
            if (response.MarketAnalysis == null)
            {
                response.MarketAnalysis = new MarketAnalysisDetailsDto();
            }

            response.MarketAnalysis.IndustryStatistics ??= new List<IndustryStatisticsDto>();
            response.MarketAnalysis.SkillDemand ??= new List<SkillDemandDto>();
            response.MarketAnalysis.MarketTrends ??= new List<MarketTrendsDto>();
        }

        public class MarketAnalysisException : Exception
        {
            public MarketAnalysisException(string message, Exception inner)
                : base(message, inner) { }
        }
    }
}
