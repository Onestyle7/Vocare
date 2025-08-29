using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using VocareWebAPI.JobRecommendationService.Models.Dtos.JobRecommendations;
using VocareWebAPI.JobRecommendationService.Models.Dtos.Perplexity;
using VocareWebAPI.JobRecommendationService.Models.Entities;
using VocareWebAPI.JobRecommendationService.Repositories.Interfaces;
using VocareWebAPI.JobRecommendationService.Services.Interfaces;
using VocareWebAPI.Models.Config;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Repositories;

namespace VocareWebAPI.JobRecommendationService.Services.Implementations
{
    public class JobRecommendationService : IJobRecommendationService
    {
        private readonly HttpClient _httpClient;
        private readonly IOptions<AiConfig> _config;
        private readonly IJobOfferRepository _jobOfferRepository;
        private readonly IAiRecommendationRepository _aiRecommendationRepository;
        private readonly ILogger<JobRecommendationService> _logger;

        public JobRecommendationService(
            HttpClient httpClient,
            IOptions<AiConfig> config,
            IJobOfferRepository jobOfferRepository,
            IAiRecommendationRepository aiRecommendationRepository,
            ILogger<JobRecommendationService> logger
        )
        {
            _httpClient = httpClient;
            _config = config;
            _jobOfferRepository = jobOfferRepository;
            _aiRecommendationRepository = aiRecommendationRepository;
            _logger = logger;

            _httpClient.DefaultRequestHeaders.Add(
                "Authorization",
                $"Bearer {_config.Value.ApiKey}"
            );
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<JobRecommendationsResponseDto> GetJobRecommendationsAsync(string userId)
        {
            try
            {
                // Pobieramy najnowszą rekomendację usera
                var latestRecommendation = await _aiRecommendationRepository.GetLatestByUserIdAsync(
                    userId
                );
                if (latestRecommendation == null)
                {
                    throw new Exception($"No recommendation foundfor user {userId}");
                }

                // Pobieramy job offers dla tej rekomandacji
                var jobOffers = await _jobOfferRepository.GetJobOffersByRecommendationIdAsync(
                    latestRecommendation.Id
                );

                // Map Entity -> DTO
                var jobOfferDtos = jobOffers.Select(MapToDto).ToList();

                return new JobRecommendationsResponseDto
                {
                    JobOffers = jobOfferDtos,
                    GeneratedAt = jobOffers.FirstOrDefault()?.CreatedAt ?? DateTime.UtcNow,
                    RecommendationId = latestRecommendation.Id,
                    TotalCount = jobOffers.Count,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting job recommendations for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> GenerateJobRecommendationsAsync(
            Guid recommendationId,
            List<string> careerPaths
        )
        {
            try
            {
                _logger.LogInformation(
                    "Generating job recommendations for recommendation {RecommendationId} with career paths: {CareerPaths}",
                    recommendationId,
                    string.Join(", ", careerPaths)
                );

                // 1. Pobierz AI recommendation details (potrzebujemy userId)
                var recommendation = await _aiRecommendationRepository.GetByIdAsync(
                    recommendationId
                );

                if (recommendation == null)
                {
                    _logger.LogError(
                        "Recommendation {RecommendationId} not found",
                        recommendationId
                    );
                    return false;
                }

                // 2. Build prompt dla Perplexity
                var prompt = BuildJobSearchPrompt(careerPaths, recommendation.UserProfile.Country);

                // 3. Przygotuj request body (copy pattern z MarketAnalysisService)
                var requestBody = new
                {
                    model = _config.Value.Model,
                    messages = new[] { new { role = "user", content = prompt } },
                };

                // 4. Call Perplexity API
                var absoluteUri = new Uri(_config.Value.BaseUrl + "/chat/completions");
                var response = await _httpClient.PostAsJsonAsync(absoluteUri, requestBody);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError(
                        "Perplexity API error: {StatusCode} - {Content}",
                        response.StatusCode,
                        errorContent
                    );
                    return false;
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation(
                    "Perplexity API Response: {ResponseContent}",
                    responseContent
                );

                // 5. Parse response (copy pattern z MarketAnalysisService)
                var apiResponse = JsonSerializer.Deserialize<PerplexityApiResponseDto>(
                    responseContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (
                    apiResponse?.Choices == null
                    || apiResponse.Choices.Count == 0
                    || apiResponse.Choices[0].Message?.Content == null
                )
                {
                    _logger.LogError("Invalid Perplexity API response: missing content");
                    return false;
                }

                // 6. Extract JSON z response content
                var rawContent = apiResponse.Choices[0].Message.Content;
                string cleanJson = ExtractJsonFromResponse(rawContent);

                // 7. Parse job offers
                var jobOffersResponse = JsonSerializer.Deserialize<JobOffersApiResponseDto>(
                    cleanJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (jobOffersResponse?.JobOffers == null || !jobOffersResponse.JobOffers.Any())
                {
                    _logger.LogWarning("No job offers found in AI response");
                    return true; // Nie błąd, po prostu brak ofert
                }

                // 8. Convert do Entity objects
                var jobOfferEntities = jobOffersResponse
                    .JobOffers.Select(dto => new JobOffer
                    {
                        Id = Guid.NewGuid(),
                        UserId = recommendation.UserId,
                        AiRecommendationId = recommendationId,
                        Company = dto.Company ?? "Nieznana firma",
                        Position = dto.Position ?? "Nieznane stanowisko",
                        ApplicationLink = dto.ApplicationLink ?? "",
                        SalaryRange = dto.SalaryRange ?? "Do uzgodnienia",
                        Location = dto.Location ?? recommendation.UserProfile.Country,
                        MatchScore = dto.MatchScore,
                        Source = dto.Source ?? "AI Generated",
                        CreatedAt = DateTime.UtcNow,
                    })
                    .ToList();

                // 9. Zapisz do bazy (automatycznie usuwa stare oferty)
                await _jobOfferRepository.AddJobOffersAsync(jobOfferEntities);

                _logger.LogInformation(
                    "Successfully generated and saved {Count} job offers for user {UserId}",
                    jobOfferEntities.Count,
                    recommendation.UserId
                );

                return true;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Error parsing JSON response from Perplexity API");
                return false;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error calling Perplexity API");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error generating job recommendations for recommendation {RecommendationId}",
                    recommendationId
                );
                return false;
            }
        }

        // Helper method - Extract JSON z Perplexity response
        private string ExtractJsonFromResponse(string rawContent)
        {
            // Perplexity czasem zwraca JSON w ```json``` bloku
            var jsonMatch = System.Text.RegularExpressions.Regex.Match(
                rawContent,
                @"```json\s*([\s\S]*?)\s*```"
            );

            if (jsonMatch.Success)
            {
                return jsonMatch.Groups[1].Value.Trim();
            }

            // Jeśli nie ma bloków, spróbuj całą response jako JSON
            return rawContent.Trim();
        }

        // Helper method - Build prompt dla AI
        private string BuildJobSearchPrompt(List<string> careerPaths, string country)
        {
            return $@"
Znajdź aktualne oferty pracy w {country} dla następujących stanowisk:
{string.Join("\n- ", careerPaths.Select(path => $"- {path}"))}

Wyszukaj najnowsze oferty (ostatnie 7 dni) z portalów: pracuj.pl, justjoin.it, rocketjobs.pl, linkedin

Zwróć maksymalnie 8 najlepszych ofert w formacie JSON:
{{
    ""jobOffers"": [
        {{
            ""company"": ""Nazwa firmy"",
            ""position"": ""Dokładne stanowisko"",
            ""applicationLink"": ""https://link-do-aplikacji"",
            ""salaryRange"": ""8000-12000 PLN brutto"",
            ""location"": ""Miasto"",
            ""matchScore"": 85,
            ""source"": ""pracuj.pl"",
            ""requirements"": [""Python"", ""SQL"", ""2+ lata doświadczenia""]
        }}
    ]
}}

WAŻNE:
- Używaj DOKŁADNYCH nazw stanowisk z listy powyżej
- ApplicationLink musi być prawdziwy, działający link
- Jeśli brak podanej stawki, oszacuj realną dla poziomu i lokalizacji  
- MatchScore bazuj na dopasowaniu do nazwy stanowiska (0-100)
- Requirements wyciągnij z opisu oferty
- Zwróć TYLKO JSON, bez dodatkowego tekstu
";
        }

        private JobOfferDto MapToDto(JobOffer entity)
        {
            return new JobOfferDto
            {
                Id = entity.Id,
                Company = entity.Company,
                Position = entity.Position,
                ApplicationLink = entity.ApplicationLink,
                SalaryRange = entity.SalaryRange,
                Location = entity.Location,
                MatchScore = entity.MatchScore,
                Source = entity.Source,
                CreatedAt = entity.CreatedAt,
                Requirements = new List<string>(), // TODO: AI będzie generować
            };
        }
    }
}
