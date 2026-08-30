using Pgvector;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;

namespace VocareWebAPI.JobOffers.Repositories.Interfaces
{
    public interface IJobOfferRecommendationRepository
    {
        Task<List<JobOffer>> GetMatchingOffersAsync(
            Vector embedding,
            JobOfferFilterCriteria filters,
            int limit = 5
        );
    }

    /// <summary>
    /// Kryteria filtrowania ofert przed wyszukiwaniem semantycznym.
    /// </summary>
    public class JobOfferFilterCriteria
    {
        /// <summary>
        /// Lista miast (np. "Wrocław", "Warszawa"). Null = brak filtra.
        /// </summary>
        public List<string>? Cities { get; set; }

        /// <summary>
        /// Czy uwzględniać oferty remote?
        /// </summary>
        public bool IncludeRemote { get; set; } = true;

        /// <summary>
        /// Lista poziomów seniority. Null = brak filtra.
        /// </summary>
        public List<SeniorityLevel>? SeniorityLevels { get; set; }

        /// <summary>
        /// Lista kategorii (np. "Backend", "Frontend"). Null = brak filtra.
        /// </summary>
        public List<string>? Categories { get; set; }
    }
}
