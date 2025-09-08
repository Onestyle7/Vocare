using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using VocareWebAPI.CareerAdvisor.Models.Config;
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
        private readonly IOptions<PerplexityConfig> _config;
        private readonly IJobOfferRepository _jobOfferRepository;
        private readonly IAiRecommendationRepository _aiRecommendationRepository;
        private readonly ILogger<JobRecommendationService> _logger;

        public JobRecommendationService(
            HttpClient httpClient,
            IOptions<PerplexityConfig> config,
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
                var prompt =
                    $@"
Zadanie: zwróć rzeczywiste oferty pracy opublikowane w ciągu ostatnich 7 dni na: pracuj.pl, justjoin.it, rocketjobs.pl.
Używaj wyłącznie linków znalezionych w wynikach wyszukiwania (nie konstruuj URL). 
Pomiń oferty bez jawnej daty publikacji ≤ 7 dni lub niedostępne.
Stanowiska: {string.Join(", ", careerPaths)}.
";

                var after = DateTime
                    .UtcNow.AddDays(-7)
                    .ToString("MM'/'dd'/'yyyy", CultureInfo.InvariantCulture);
                var before = DateTime.UtcNow.ToString(
                    "MM'/'dd'/'yyyy",
                    CultureInfo.InvariantCulture
                );

                var requestBody = new
                {
                    model = _config.Value.Model, // "sonar-pro"
                    messages = new object[]
                    {
                        new
                        {
                            role = "system",
                            content = "Zwracaj wyłącznie poprawny JSON zgodny ze schematem. Bez komentarzy i markdown.",
                        },
                        new { role = "user", content = prompt },
                    },
                    search_domain_filter = new[] { "pracuj.pl", "justjoin.it", "rocketjobs.pl" }, // allowlist
                    search_after_date_filter = after, // np. "09/01/2025"
                    search_before_date_filter = before, // np. "09/08/2025"
                    web_search_options = new { search_context_size = "high" }, // "low" | "medium" | "high"
                    response_format = new
                    {
                        type = "json_schema",
                        json_schema = new
                        {
                            name = "job_offers",
                            schema = new
                            {
                                type = "object",
                                additionalProperties = false,
                                properties = new Dictionary<string, object>
                                {
                                    ["jobOffers"] = new
                                    {
                                        type = "array",
                                        minItems = 6,
                                        maxItems = 8,
                                        items = new
                                        {
                                            type = "object",
                                            additionalProperties = false,
                                            properties = new Dictionary<string, object>
                                            {
                                                ["company"] = new
                                                {
                                                    type = "string",
                                                    minLength = 2,
                                                },
                                                ["position"] = new
                                                {
                                                    type = "string",
                                                    minLength = 2,
                                                },
                                                ["applicationLink"] = new
                                                {
                                                    type = "string",
                                                    format = "uri",
                                                    // dopuszczalne domeny (HTTPS)
                                                    pattern = "^(https://(www\\.)?(pracuj\\.pl|justjoin\\.it|rocketjobs\\.pl)/.+)$",
                                                },
                                                ["salaryRange"] = new { type = "string" },
                                                ["location"] = new { type = "string" },
                                                ["matchScore"] = new
                                                {
                                                    type = "integer",
                                                    minimum = 0,
                                                    maximum = 100,
                                                },
                                                ["source"] = new { type = "string" },
                                                ["postedAt"] = new
                                                {
                                                    type = "string",
                                                    format = "date",
                                                },
                                            },
                                            required = new[]
                                            {
                                                "company",
                                                "position",
                                                "applicationLink",
                                                "location",
                                                "matchScore",
                                                "source",
                                            },
                                        },
                                    },
                                },
                                required = new[] { "jobOffers" },
                            },
                        },
                    },
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

                // 8. Convert do Entity objects + WALIDACJA LINKÓW
                var validJobOffers = new List<JobOffer>();

                foreach (var dto in jobOffersResponse.JobOffers)
                {
                    // Waliduj link przed dodaniem
                    var isLinkValid = await ValidateJobLinkAsync(dto.ApplicationLink);

                    if (isLinkValid)
                    {
                        validJobOffers.Add(
                            new JobOffer
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
                            }
                        );
                    }
                    else
                    {
                        _logger.LogWarning(
                            "Rejected invalid job link: {Link} for company {Company}",
                            dto.ApplicationLink,
                            dto.Company
                        );
                    }
                }

                if (!validJobOffers.Any())
                {
                    _logger.LogWarning("No valid job offers found after link validation");
                    return false;
                }

                // 9. Zapisz do bazy (automatycznie usuwa stare oferty)
                await _jobOfferRepository.AddJobOffersAsync(validJobOffers);

                _logger.LogInformation(
                    "Successfully generated and saved {Count} job offers for user {UserId}",
                    validJobOffers.Count,
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
                Requirements = new List<string>(),
            };
        }

        private static readonly HttpMethod Head = new HttpMethod("HEAD");

        private async Task<bool> IsReachableAsync(string url, CancellationToken ct)
        {
            using var req = new HttpRequestMessage(Head, url);
            req.Headers.UserAgent.ParseAdd(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
            );
            req.Headers.AcceptLanguage.ParseAdd("pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7");

            try
            {
                using var headRes = await _httpClient.SendAsync(
                    req,
                    HttpCompletionOption.ResponseHeadersRead,
                    ct
                );
                if ((int)headRes.StatusCode >= 200 && (int)headRes.StatusCode < 400)
                    return true;

                using var getReq = new HttpRequestMessage(HttpMethod.Get, url);
                getReq.Headers.UserAgent.ParseAdd(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
                );
                using var getRes = await _httpClient.SendAsync(
                    getReq,
                    HttpCompletionOption.ResponseHeadersRead,
                    ct
                );
                return (int)getRes.StatusCode >= 200 && (int)getRes.StatusCode < 400;
            }
            catch
            {
                return false;
            }
        }

        private async Task<bool> ValidateJobLinkAsync(string? url)
        {
            if (
                string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri)
            )
            {
                return false;
            }

            // Sprawdź tylko dozwolone domeny
            var allowedDomains = new[]
            {
                "pracuj.pl",
                "justjoin.it",
                "rocketjobs.pl",
                "linkedin.com",
            };
            if (!allowedDomains.Any(domain => uri.Host.Contains(domain)))
            {
                _logger.LogWarning("Rejected link from non-allowed domain: {Domain}", uri.Host);
                return false;
            }

            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Head, url);

                // Realistyczne headers
                request.Headers.Add(
                    "User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                );
                request.Headers.Add("Accept-Language", "pl-PL,pl;q=0.9,en;q=0.8");
                request.Headers.Add(
                    "Accept",
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                );

                // Krótki timeout dla walidacji
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                var response = await _httpClient.SendAsync(request, cts.Token);

                // Akceptuj 2xx/3xx
                if (
                    response.IsSuccessStatusCode
                    || (
                        response.StatusCode >= System.Net.HttpStatusCode.MultipleChoices
                        && response.StatusCode < System.Net.HttpStatusCode.BadRequest
                    )
                )
                {
                    return true;
                }

                // Fallback: jeśli HEAD nie działa, spróbuj lekkiego GET
                if (response.StatusCode == System.Net.HttpStatusCode.MethodNotAllowed)
                {
                    return await ValidateWithGetAsync(url);
                }

                _logger.LogDebug(
                    "Link validation failed for {Url}: {StatusCode}",
                    url,
                    response.StatusCode
                );
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogDebug("Link validation exception for {Url}: {Message}", url, ex.Message);
                return false;
            }
        }

        private async Task<bool> ValidateWithGetAsync(string url)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add(
                    "User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                );
                request.Headers.Add("Range", "bytes=0-1023"); // Tylko pierwsze 1KB

                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                var response = await _httpClient.SendAsync(request, cts.Token);

                return response.IsSuccessStatusCode
                    || (
                        response.StatusCode >= System.Net.HttpStatusCode.MultipleChoices
                        && response.StatusCode < System.Net.HttpStatusCode.BadRequest
                    );
            }
            catch
            {
                return false;
            }
        }
    }
}
