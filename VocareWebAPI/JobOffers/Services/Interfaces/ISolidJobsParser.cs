using VocareWebAPI.JobOffers.Models.Entities;

namespace VocareWebAPI.JobOffers.Services.Interfaces
{
    public interface ISolidJobsParser
    {
        Task<IEnumerable<JobOffer>> FetchOffersAsync(CancellationToken cancellationToken = default);
    }
}
