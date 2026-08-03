using System.Runtime.CompilerServices;
using VocareWebAPI.JobOffers.Models.Entities;

namespace VocareWebAPI.JobOffers.Services.Interfaces
{
    public interface INoFluffJobsParser
    {
        IAsyncEnumerable<JobOffer> ParseFromUrlAsync(
            string url,
            CancellationToken cancellationToken = default
        );
    }
}
