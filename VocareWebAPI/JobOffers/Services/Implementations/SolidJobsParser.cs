using System.Runtime.CompilerServices;
using VocareWebAPI.JobOffers.ExternalClients.SolidJobs;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Services.Interfaces;
using SolidJobsModels = VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class SolidJobsParser : ISolidJobsParser
    {
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
                var divisionOffers = new List<JobOffer>();
                try
                {
                    await foreach (
                        var offer in _client.GetAllOffersAsync(
                            division,
                            CampaignName,
                            null,
                            cancellationToken
                        )
                    )
                    {
                        divisionOffers.Add(offer.ToJobOfferEntity());
                    }
                    _logger.LogInformation(
                        "Fetched {Count} offers for division {Division}",
                        divisionOffers.Count,
                        division
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching offers for division {Division}", division);
                }
                foreach (var offer in divisionOffers)
                {
                    yield return offer;
                }
            }
        }
    }
}
