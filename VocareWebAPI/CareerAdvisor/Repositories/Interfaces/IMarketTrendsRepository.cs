using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.Repositories.Interfaces
{
    /// <summary>
    /// Interfejjs repozytorium dla operacji na trendach rynkowych w bazie danych
    /// </summary>
    public interface IMarketTrendsRepository
    {
        /// <summary>
        /// Dodaje nowy trend rynkowy do bazy danych
        /// </summary>
        /// <param name="entity">Trend rynkowy do dodania</param>
        /// <returns>Task reprezentujący operację asynchroniczną</returns>
        Task AddAsync(MarketTrends entity);
        Task<List<MarketTrends>> GetByAiRecommendationIdAsync(Guid aiRecommendationId);
    }
}
