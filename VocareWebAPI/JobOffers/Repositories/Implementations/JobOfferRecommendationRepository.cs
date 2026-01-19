using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Repositories.Interfaces;

namespace VocareWebAPI.JobOffers.Repositories.Implementations
{
    public class JobOfferRecommendationRepository : IJobOfferRecommendationRepository
    {
        private readonly AppDbContext _context;

        public JobOfferRecommendationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<JobOffer>> GetMatchingOffersAsync(Vector embedding, int limit = 5)
        {
            // Używamy CosineDistance - odległość kosinusowa
            //Sortujemy od najmniejzej odległosi (najwieksze prawdopodobienstwo)
            return await _context
                .JobOffers.Where(j => j.Embedding != null)
                .OrderBy(j => j.Embedding!.CosineDistance(embedding))
                .Take(limit)
                .ToListAsync();
        }
    }
}
