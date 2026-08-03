using System.Runtime.CompilerServices;
using VocareWebAPI.JobOffers.Models.Entities;

namespace VocareWebAPI.JobOffers.Services.Interfaces
{
    public interface ISolidJobsParser
    {
        IAsyncEnumerable<JobOffer> FetchOffersAsync(CancellationToken cancellationToken = default);
    }
}
