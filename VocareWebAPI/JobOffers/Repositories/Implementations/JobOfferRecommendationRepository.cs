using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<IJobOfferRecommendationRepository> _logger;

        public JobOfferRecommendationRepository(
            AppDbContext context,
            ILogger<IJobOfferRecommendationRepository> logger
        )
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<JobOffer>> GetMatchingOffersAsync(Vector embedding, int limit = 5)
        {
            return await _context
                .JobOffers.Include(j => j.Locations)
                .Include(j => j.Skills)
                .Where(j => j.Embedding != null)
                .OrderBy(j => j.Embedding!.CosineDistance(embedding))
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<JobOffer>> GetMatchingOffersAsync(
            Vector embedding,
            JobOfferFilterCriteria filters,
            int limit = 5
        )
        {
            var query = _context
                .JobOffers.Include(j => j.Locations)
                .Include(j => j.Skills)
                .Where(j => j.Embedding != null);

            // Filtr lokalizacji
            if (filters.Cities != null && filters.Cities.Any())
            {
                if (filters.IncludeRemote)
                {
                    // Oferty w podanych miastach LUB remote
                    query = query.Where(j =>
                        j.Locations.Any(l => filters.Cities.Contains(l.City) || l.IsRemote)
                    );
                }
                else
                {
                    // Tylko oferty w podanych miastach (bez remote)
                    query = query.Where(j =>
                        j.Locations.Any(l => filters.Cities.Contains(l.City) && !l.IsRemote)
                    );
                }
            }
            else if (filters.IncludeRemote)
            {
                // Jeśli nie podano miast, ale IncludeRemote = true, to nie filtrujemy
            }

            // Filtr seniority
            if (filters.SeniorityLevels != null && filters.SeniorityLevels.Any())
            {
                query = query.Where(j => filters.SeniorityLevels.Contains(j.SeniorityLevel));
            }

            // Filtr kategorii
            if (filters.Categories != null && filters.Categories.Any())
            {
                var lowerCategories = filters.Categories.Select(c => c.ToLower()).ToList();
                query = query.Where(j => lowerCategories.Contains(j.Category.ToLower()));
            }

            // Logujemy ile ofert zostało po filtrach
            var filteredCount = await query.CountAsync();
            _logger.LogDebug(
                "Po filtrach pozostało {Count} ofert do porównania semantycznego",
                filteredCount
            );

            // Sortowanie po podobieństwie i limit
            return await query
                .OrderBy(j => j.Embedding!.CosineDistance(embedding))
                .Take(limit)
                .ToListAsync();
        }
    }
}
