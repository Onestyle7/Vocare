using System.Security.Claims;
using System.Text.Json;
using AutoMapper;
using Microsoft.Extensions.Options;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Config;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Dtos.MarketAnalysis;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.Entities.MarketAnalysis;
using VocareWebAPI.Repositories;
using VocareWebAPI.Repositories.Interfaces;

namespace VocareWebAPI.Services.Implementations
{
    public class MarketAnalysisService : IMarketAnalysisService
    {
        private readonly HttpClient _httpClient;
        private readonly AiConfig _config;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly ICareerStatisticsRepository _careerStatisticsRepository;
        private readonly ISkillDemandRepository _skillDemandRepository;
        private readonly IMarketTrendsRepository _marketTrendsRepository;
        private readonly IAiRecommendationRepository _aiRecommendationRepository;
        private readonly ILogger<MarketAnalysisService> _logger;

        public MarketAnalysisService(
            HttpClient httpClient,
            IOptions<AiConfig> config,
            IUserProfileRepository userProfileRepository,
            ICareerStatisticsRepository marketAnalysisRepository,
            ISkillDemandRepository skillDemandRepository,
            IMarketTrendsRepository marketTrendsRepository,
            IAiRecommendationRepository aiRecommendationRepository,
            ILogger<MarketAnalysisService> logger
        )
        {
            _httpClient = httpClient;
            _config = config.Value;
            _userProfileRepository = userProfileRepository;
            _marketTrendsRepository = marketTrendsRepository;
            _skillDemandRepository = skillDemandRepository;
            _careerStatisticsRepository = marketAnalysisRepository;
            _aiRecommendationRepository = aiRecommendationRepository;
            _logger = logger;

            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<MarketAnalysisResponseDto> GetMarketAnalysisAsync(string userId)
        {
            //Pobieramy profil użytkownika
            var userProfile = await _userProfileRepository.GetUserProfileByIdAsync(userId);

            if (userProfile == null)
            {
                throw new Exception($"User profile with ID:{userId} not found.");
            }

            // Pobieramy rekomendację AI dla użytkownika
            var recommendation = await _aiRecommendationRepository.GetLatestByUserIdAsync(userId);
            if (recommendation == null)
            {
                throw new Exception($"AI recommendation for user with ID:{userId} not found.");
            }

            var prompt = BuildPrompt(recommendation);
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
                _logger.LogInformation("AI API Response: {responseContent}", responseContent);
                if (!response.IsSuccessStatusCode)
                {
                    throw new Exception(
                        $"API returned error {response.StatusCode}: {responseContent}"
                    );
                }
                var apiResponse = JsonSerializer.Deserialize<PerplexityApiResponseDto>(
                    responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                // Wyodrębniamy JSON z pola content
                var rawContent = apiResponse.Choices[0].Message.Content;

                MarketAnalysisResponseDto result = null;

                // Szukamy bloku Json

                if (rawContent.Contains("```json") && rawContent.Contains("```"))
                {
                    var jsonStart = rawContent.IndexOf("```json") + "```json".Length;
                    var jsonEnd = rawContent.LastIndexOf("```");
                    if (jsonStart >= "```json".Length && jsonEnd > jsonStart)
                    {
                        var cleanJson = rawContent.Substring(jsonStart, jsonEnd - jsonStart).Trim();
                        // Usuń dodatkowe białe znaki lub linie
                        cleanJson = cleanJson.TrimStart('\n').TrimEnd('\n');
                        try
                        {
                            result = JsonSerializer.Deserialize<MarketAnalysisResponseDto>(
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
                            throw; // Opcjonalnie: zgłoś błąd dalej
                        }
                    }
                    else
                    {
                        _logger.LogError(
                            "Invalid JSON block boundaries in raw content: {rawContent}",
                            rawContent
                        );
                    }
                }
                else
                {
                    _logger.LogError(
                        "No JSON block found in raw content: {rawContent}",
                        rawContent
                    );
                }

                if (result == null)
                {
                    try
                    {
                        result = JsonSerializer.Deserialize<MarketAnalysisResponseDto>(
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
                        throw new Exception("Failed to parse the response content as JSON.", ex);
                    }
                }
                // Inicjalizujemy null properties
                InitializeNullProperties(result);

                await SaveMarketAnalysisToDatabase(result, recommendation.Id);
                return result;
            }
            catch (Exception ex)
            {
                throw new Exception("Error while calling the AI API.", ex);
            }
        }

        private async Task SaveMarketAnalysisToDatabase(
            MarketAnalysisResponseDto analysis,
            Guid aiRecommendationId
        )
        {
            try
            {
                foreach (var industryStat in analysis.MarketAnalysis.IndustryStatistics)
                {
                    var salaryRange = industryStat.AverageSalary.Replace(" PLN", "").Split('-');
                    var careerStat = new CareerStatistics
                    {
                        Id = Guid.NewGuid(),
                        CareerName = industryStat.Industry,
                        AverageSalaryMin = decimal.Parse(salaryRange[0]),
                        AverageSalaryMax = decimal.Parse(salaryRange[1]),
                        EmploymentRate = int.Parse(industryStat.EmploymentRate.Replace("%", "")),
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
                throw new Exception("Error while saving market analysis to the database.", ex);
            }
        }

        private void InitializeNullProperties(MarketAnalysisResponseDto response)
        {
            if (response.MarketAnalysis == null)
            {
                response.MarketAnalysis = new MarketAnalysisDetailsDto();
            }

            if (response.MarketAnalysis.IndustryStatistics == null)
            {
                response.MarketAnalysis.IndustryStatistics = new List<IndustryStatisticsDto>();
            }

            if (response.MarketAnalysis.SkillDemand == null)
            {
                response.MarketAnalysis.SkillDemand = new List<SkillDemandDto>();
            }

            if (response.MarketAnalysis.MarketTrends == null)
            {
                response.MarketAnalysis.MarketTrends = new List<MarketTrendsDto>();
            }
        }

        private string BuildPrompt(AiRecommendation recommendation)
        {
            return $$"""
                Jesteś ekspertem ds. analizy rynku pracy. Upewnij się, że działasz wyłącznie na danych z 2024 i 2025 roku. Na podstawie poniższych danych z rekomendacji zawodowych użytkownika:

                Rekomendowane ścieżki kariery:
                {{string.Join(", ", recommendation.CareerPaths.Select(cp => cp.CareerName))}}

                Uzasadnienie:
                {{recommendation.Justification}}

                Długoterminowy cel:
                {{recommendation.LongTermGoal}}

                Kolejne kroki:
                {{string.Join(", ", recommendation.NextSteps.Select(ns => ns.Step))}}

                Lokalizacja użytkownika:
                {{recommendation.UserProfile.Country}}, {{recommendation.UserProfile.Address}} Dopilnuj, żeby język odpowiedzi był zgodny z {{recommendation.UserProfile.Country}}.

                Wygeneruj wyłącznie obiekt JSON z analizą rynku w języku {{recommendation.UserProfile.Country}}, który pomoże użytkownikowi zrozumieć aktualne trendy i zapotrzebowanie na rynku pracy w kontekście jego rekomendowanych ścieżek kariery. Struktura JSON musi być następująca:

                {
                  "marketAnalysis": {
                    "industryStatistics": [
                      {
                        "industry": "Nazwa branży",
                        "averageSalary": "Średnie zarobki (np. 10000 PLN)",
                        "employmentRate": "Poziom zatrudnienia (np. 85%)",
                        "growthForecast": "Prognoza wzrostu (High/Medium/Low)"
                      }
                      // Dodaj statystyki dla co najmniej 3 branż powiązanych z rekomendowanymi ścieżkami
                    ],
                    "skillDemand": [
                      {
                        "skill": "Nazwa umiejętności",
                        "demandLevel": "Poziom zapotrzebowania (niski/średni/wysoki/bardzo wysoki)",
                        "industry": "Branża"
                      }
                      // Dodaj zapotrzebowanie dla co najmniej 5 umiejętności związanych z rekomendowanymi ścieżkami
                    ],
                    "marketTrends": [
                      {
                        "trendName": "Nazwa trendu",
                        "description": "Opis trendu",
                        "impact": "Wpływ na rynek (np. Zwiększone zapotrzebowanie na specjalistów)"
                      }
                      // Dodaj co najmniej 3 trendy rynkowe istotne dla rekomendowanych ścieżek
                    ]
                  }
                }

                Ważne:
                1. Wygeneruj dokładnie taki format JSON z danymi dla co najmniej 3 branż, 5 umiejętności i 3 trendów.
                2. Wypełnij wszystkie pola sensownymi, realistycznymi wartościami – nie pozostawiaj żadnych pól pustych.
                3. Dane powinny odzwierciedlać aktualne trendy rynkowe i być dostosowane do lokalizacji użytkownika ({{recommendation.UserProfile.Country}}).
                4. Zwróć tylko czysty JSON bez dodatkowych objaśnień czy komentarzy.
                """;
        }

        public class MarketAnalysisException : Exception
        {
            public MarketAnalysisException(string message, Exception inner)
                : base(message, inner) { }
        }
    }
}
