using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
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

        public async Task<List<JobOffer>> GetMatchingOffersAsync(
            Vector embedding,
            JobOfferFilterCriteria filters,
            int limit = 5
        )
        {
            // Budujemy parametry
            var parameters = new List<NpgsqlParameter>
            {
                new NpgsqlParameter("@embedding", embedding),
                new NpgsqlParameter("@limit", limit),
            };

            var whereClauses = new List<string> { "j.\"Embedding\" IS NOT NULL" };

            // Filtr lokalizacji
            if (filters.Cities != null && filters.Cities.Any())
            {
                parameters.Add(new NpgsqlParameter("@cities", filters.Cities.ToArray()));

                if (filters.IncludeRemote)
                {
                    whereClauses.Add(
                        """
                        EXISTS (
                            SELECT 1 FROM public."JobOfferLocations" loc 
                            WHERE loc."JobOfferId" = j."Id" 
                            AND (loc."City" = ANY(@cities) OR loc."IsRemote" = true)
                        )
                        """
                    );
                }
                else
                {
                    whereClauses.Add(
                        """
                        EXISTS (
                            SELECT 1 FROM public."JobOfferLocations" loc 
                            WHERE loc."JobOfferId" = j."Id" 
                            AND loc."City" = ANY(@cities) AND loc."IsRemote" = false
                        )
                        """
                    );
                }
            }

            // Filtr seniority
            if (filters.SeniorityLevels != null && filters.SeniorityLevels.Any())
            {
                var seniorityInts = filters.SeniorityLevels.Select(s => (int)s).ToArray();
                parameters.Add(new NpgsqlParameter("@seniority", seniorityInts));
                whereClauses.Add("j.\"SeniorityLevel\" = ANY(@seniority)");
            }

            // Filtr kategorii
            if (filters.Categories != null && filters.Categories.Any())
            {
                var lowerCategories = filters.Categories.Select(c => c.ToLower()).ToArray();
                parameters.Add(new NpgsqlParameter("@categories", lowerCategories));
                whereClauses.Add("lower(j.\"Category\") = ANY(@categories)");
            }

            var whereClause = string.Join(" AND ", whereClauses);

            var sql = $"""
                SELECT j.* 
                FROM public."JobOffers" j
                WHERE {whereClause}
                ORDER BY j."Embedding" <=> @embedding
                LIMIT @limit
                """;

            _logger.LogDebug("SQL Query: {Sql}", sql);

            var jobOffers = await _context
                .JobOffers.FromSqlRaw(sql, parameters.ToArray())
                .Include(j => j.Locations)
                .Include(j => j.Skills)
                .ToListAsync();

            return jobOffers;
        }
    }
}
