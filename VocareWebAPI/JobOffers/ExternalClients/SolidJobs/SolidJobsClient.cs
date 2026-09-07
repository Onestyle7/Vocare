using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models;

namespace VocareWebAPI.JobOffers.ExternalClients.SolidJobs
{
    public sealed partial class SolidJobsClient
    {
        private static readonly Regex CampaignRegex = CampaignRegexCompiled();

        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
        {
            Converters = { new JsonStringEnumConverter() },
        };

        private readonly HttpClient http;
        private readonly int maxRetries;

        /// <param name="http">Shared HttpClient (from IHttpClientFactory).</param>
        /// <param name="maxRetries">Number of retries when the API responds with 429.</param>
        public SolidJobsClient(HttpClient http, int maxRetries = 3)
        {
            this.http = http;
            this.maxRetries = maxRetries;
        }

        /// <summary>Fetches a single page of offers for the given division.</summary>
        public async Task<OffersResponse> GetOffersAsync(
            Division division,
            string campaign,
            OfferQuery? query = null,
            CancellationToken cancellationToken = default
        )
        {
            if (!CampaignRegex.IsMatch(campaign))
            {
                throw new ArgumentException(
                    "Campaign must contain only lowercase letters, digits and hyphens (max 64 chars).",
                    nameof(campaign)
                );
            }

            var requestUri = BuildRequestUri(division, campaign, query ?? new OfferQuery());

            using var response = await SendWithRetryAsync(requestUri, cancellationToken);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<OffersResponse>(
                JsonOptions,
                cancellationToken
            );

            return result
                ?? throw new InvalidOperationException("API returned an empty response body.");
        }

        /// <summary>Fetches labour-market statistics for the given scope.</summary>
        /// <param name="scopeKind">Scope kind: <c>division</c>, <c>mainCategory</c>, <c>subcategory</c>, <c>subcategoryGroup</c> or <c>city</c>.</param>
        /// <param name="scopeKey">Scope key within the kind (e.g. <c>IT</c>, <c>React</c>, <c>warszawa</c>).</param>
        /// <param name="campaign">Traffic-tracking identifier (required).</param>
        /// <param name="fields">Optional subset of sections to return; null/empty returns all sections available for the scope.</param>
        public async Task<MarketStatisticsResponse> GetMarketStatisticsAsync(
            string scopeKind,
            string scopeKey,
            string campaign,
            IReadOnlyList<string>? fields = null,
            CancellationToken cancellationToken = default
        )
        {
            if (!CampaignRegex.IsMatch(campaign))
            {
                throw new ArgumentException(
                    "Campaign must contain only lowercase letters, digits and hyphens (max 64 chars).",
                    nameof(campaign)
                );
            }

            var query = $"campaign={Uri.EscapeDataString(campaign)}";
            if (fields is { Count: > 0 })
            {
                query += $"&fields={Uri.EscapeDataString(string.Join(',', fields))}";
            }

            var requestUri =
                $"public-api/market-statistics/{Uri.EscapeDataString(scopeKind)}/{Uri.EscapeDataString(scopeKey)}?{query}";

            using var response = await SendWithRetryAsync(requestUri, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new HttpRequestException($"HTTP {(int)response.StatusCode}: {body}");
            }

            var result = await response.Content.ReadFromJsonAsync<MarketStatisticsResponse>(
                JsonOptions,
                cancellationToken
            );

            return result
                ?? throw new InvalidOperationException("API returned an empty response body.");
        }

        /// <summary>
        /// Streams every offer matching the criteria, walking the pages automatically.
        /// </summary>
        public async IAsyncEnumerable<JobOffer> GetAllOffersAsync(
            Division division,
            string campaign,
            OfferQuery? query = null,
            [EnumeratorCancellation] CancellationToken cancellationToken = default
        )
        {
            var baseQuery = query ?? new OfferQuery();
            var pageIndex = baseQuery.PageIndex;

            while (true)
            {
                var page = await GetOffersAsync(
                    division,
                    campaign,
                    baseQuery with
                    {
                        PageIndex = pageIndex,
                    },
                    cancellationToken
                );

                foreach (var job in page.Jobs)
                {
                    yield return job;
                }

                pageIndex++;

                if (page.Jobs.Count == 0 || pageIndex >= page.TotalPages)
                {
                    yield break;
                }
            }
        }

        private async Task<HttpResponseMessage> SendWithRetryAsync(
            string requestUri,
            CancellationToken cancellationToken
        )
        {
            for (var attempt = 0; ; attempt++)
            {
                var response = await http.GetAsync(requestUri, cancellationToken);

                if (
                    response.StatusCode is not HttpStatusCode.TooManyRequests
                    || attempt >= maxRetries
                )
                {
                    return response;
                }

                var delay = GetRetryDelay(response.Headers.RetryAfter, attempt);
                response.Dispose();

                await Task.Delay(delay, cancellationToken);
            }
        }

        private static TimeSpan GetRetryDelay(RetryConditionHeaderValue? retryAfter, int attempt)
        {
            if (retryAfter?.Delta is { } delta)
            {
                return delta;
            }

            if (retryAfter?.Date is { } date)
            {
                var until = date - DateTimeOffset.UtcNow;
                if (until > TimeSpan.Zero)
                {
                    return until;
                }
            }

            return TimeSpan.FromSeconds(Math.Pow(2, attempt));
        }

        private static string BuildRequestUri(Division division, string campaign, OfferQuery query)
        {
            var parameters = new List<KeyValuePair<string, string>> { new("campaign", campaign) };

            if (query.PageIndex > 0)
            {
                parameters.Add(
                    new("pageIndex", query.PageIndex.ToString(CultureInfo.InvariantCulture))
                );
            }

            if (query.PageSize is { } pageSize)
            {
                parameters.Add(new("pageSize", pageSize.ToString(CultureInfo.InvariantCulture)));
            }

            if (query.Sort is { } sort)
            {
                parameters.Add(new("sortActive", ToSortToken(sort)));
                parameters.Add(
                    new("sortDirection", query.Direction is SortDirection.Desc ? "desc" : "asc")
                );
            }

            if (query.Cities.Count > 0)
            {
                parameters.Add(new("search.cities", string.Join(',', query.Cities)));
            }

            AddRepeated(
                parameters,
                "search.categories",
                query.Categories.Select(c => c.ToString())
            );
            AddRepeated(
                parameters,
                "search.subCategories",
                query.SubCategories.Select(sc => sc.ToString())
            );
            AddRepeated(
                parameters,
                "search.experiences",
                query.Experiences.Select(e => e.ToString())
            );
            AddRepeated(parameters, "search.searchTerm", query.SearchTerms);

            if (query.MinimumSalary is { } minimumSalary)
            {
                parameters.Add(
                    new(
                        "search.minimumSalary",
                        minimumSalary.ToString(CultureInfo.InvariantCulture)
                    )
                );
            }

            var queryString = string.Join(
                '&',
                parameters.Select(p =>
                    $"{Uri.EscapeDataString(p.Key)}={Uri.EscapeDataString(p.Value)}"
                )
            );

            return $"public-api/offers/{division}?{queryString}";

            static void AddRepeated(
                List<KeyValuePair<string, string>> target,
                string key,
                IEnumerable<string> values
            )
            {
                foreach (var value in values)
                {
                    target.Add(new(key, value));
                }
            }
        }

        private static string ToSortToken(SortField sort) =>
            sort switch
            {
                SortField.ValidFrom => "validFrom",
                SortField.ValidTo => "validTo",
                SortField.Title => "title",
                SortField.Company => "company",
                SortField.SalaryFrom => "salaryFrom",
                SortField.SalaryTo => "salaryTo",
                SortField.ExperienceLevel => "experienceLevel",
                _ => "validFrom",
            };

        [GeneratedRegex(@"^[a-z0-9-]{1,64}$", RegexOptions.Compiled)]
        private static partial Regex CampaignRegexCompiled();
    }
}
