using VocareWebAPI.JobOffers.ExternalClients.SolidJobs;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Services.Interfaces;
using SolidJobsModels = VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class SolidJobsParser : ISolidJobsParser
    {
        private readonly string CampaignName = "vocare";
        private readonly SolidJobsClient _client;
        private readonly ILogger<SolidJobsParser> _logger;

        public SolidJobsParser(SolidJobsClient client, ILogger<SolidJobsParser> logger)
        {
            _client = client;
            _logger = logger;
        }

        public async Task<IEnumerable<JobOffer>> FetchOffersAsync(
            CancellationToken cancellationToken = default
        )
        {
            var results = new List<JobOffer>();
            foreach (var division in Enum.GetValues<SolidJobsModels.Division>())
            {
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
                        var mappedOffer = MapToJobOffer(offer);
                        results.Add(mappedOffer);
                    }
                    _logger.LogInformation(
                        "Fetched {Count} offers for division {Division}",
                        results.Count,
                        division
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching offers for division {Division}", division);
                }
            }
            return results;
        }
        private JobOffer MapToJobOffer(SolidJobsModels.JobOffer offer)
        {
            return new JobOffer
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = offer.JobOfferKey,
                Title = offer.Title,
                CompanyName = offer.Company,
                Url = offer.Url,
                Country = ,
            };
        }
    }
}
