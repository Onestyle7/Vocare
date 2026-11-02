using System.Runtime.CompilerServices;
using VocareWebAPI.JobOffers.ExternalClients.SolidJobs;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Services.Interfaces;
using SolidJobsModels = VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class SolidJobsParser : IJobOfferProvider
    {
        public JobOfferSource Source { get; } = JobOfferSource.SolidJobs;
        private const string CampaignName = "vocare";

        // API ignoruje pageIndex, jeśli nie dostanie pageSize - bez tego każda strona to ta sama pierwsza strona.
        // 500 to maksimum API, więc przy okazji robimy najmniej zapytań (limit 300 req/min)
        private static readonly SolidJobsModels.OfferQuery OffersQuery = new() { PageSize = 500 };

        private readonly SolidJobsClient _client;
        private readonly ILogger<SolidJobsParser> _logger;

        public SolidJobsParser(SolidJobsClient client, ILogger<SolidJobsParser> logger)
        {
            _client = client;
            _logger = logger;
        }

        public async IAsyncEnumerable<JobOffer> FetchOffersAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken = default
        )
        {
            foreach (var division in Enum.GetValues<SolidJobsModels.Division>())
            {
                var count = 0;

                await using var enumerator = _client
                    .GetAllOffersAsync(division, CampaignName, OffersQuery, cancellationToken)
                    .GetAsyncEnumerator(cancellationToken);

                while (true)
                {
                    try
                    {
                        if (!await enumerator.MoveNextAsync())
                            break;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(
                            ex,
                            "Error fetching offers for division {Division} after {Count} offers",
                            division,
                            count
                        );
                        break;
                    }

                    yield return enumerator.Current.ToJobOfferEntity();
                    count++;
                }

                _logger.LogInformation(
                    "Fetched {Count} offers for division {Division}",
                    count,
                    division
                );
            }
        }
    }
}
