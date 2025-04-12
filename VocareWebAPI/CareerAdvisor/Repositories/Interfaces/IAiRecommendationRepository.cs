using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models;

namespace VocareWebAPI.Repositories
{
    /// <summary>
    /// Interfejs repozytorium dla operacji na rekomendacjach AI w bazie danych
    /// </summary>
    public interface IAiRecommendationRepository
    {
        /// <summary>
        /// Dodaje nową rekomendację do bazy danych
        /// </summary>
        /// <param name="recommendation">Rekomendacja AI do dodania</param>
        /// <returns>Task reprezentujący operację asynchroniczną</returns>
        Task AddRecommendationAsync(AiRecommendation recommendation);

        /// <summary>
        /// Pobiera najnowszą rekomendację AI dla danego użytkownika
        /// </summary>
        /// <param name="userId">Id użytkownika</param>
        /// <returns>Najnowsza rekomendacja AI</returns>
        Task<AiRecommendation> GetLatestByUserIdAsync(string userId);
    }
}
