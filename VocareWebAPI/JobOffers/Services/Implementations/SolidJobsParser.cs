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
                await foreach (
                    var offer in _client.GetAllOffersAsync(
                        division,
                        CampaignName,
                        null,
                        cancellationToken
                    )
                )
                {
                    yield return offer.ToJobOfferEntity();
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
