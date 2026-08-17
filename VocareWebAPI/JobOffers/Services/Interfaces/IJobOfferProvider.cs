using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;

namespace VocareWebAPI.JobOffers.Services.Interfaces
{
    public interface IJobOfferProvider
    {
        JobOfferSource Source { get; }
        IAsyncEnumerable<JobOffer> FetchOffersAsync(CancellationToken cancellationToken = default);
    }
}
