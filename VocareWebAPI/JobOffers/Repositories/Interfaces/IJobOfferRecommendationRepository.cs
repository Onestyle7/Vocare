using Pgvector;
using VocareWebAPI.JobOffers.Models.Entities;

namespace VocareWebAPI.JobOffers.Repositories.Interfaces
{
    public interface IJobOfferRecommendationRepository
    {
        Task<List<JobOffer>> GetMatchingOffersAsync(Vector embedding, int limit = 5);
    }
}
