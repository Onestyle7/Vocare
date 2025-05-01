using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities.MarketAnalysis;
using VocareWebAPI.Repositories.Interfaces;

namespace VocareWebAPI.Repositories.Implementations
{
    /// <summary>
    /// Repozytorium odpowiedzialne za operacje na trendach rynkowych w bazie danych
    /// </summary>
    public class MarketTrendsRepository : IMarketTrendsRepository
    {
        private readonly AppDbContext _context;

        /// <summary>
        /// Inicjalizuje instancję repozytorium
        /// </summary>
        /// <param name="context"></param>
        public MarketTrendsRepository(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Dodaje nowy tren rynkowy do bazy danych
        /// </summary>
        /// <param name="entity">Trend rynkowy do dodania</param>
        /// <returns>Task reprezentujący operację asynchroniczną</returns>
        public async Task AddAsync(MarketTrends entity)
        {
            await _context.MarketTrends.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<List<MarketTrends>> GetByAiRecommendationIdAsync(Guid aiRecommendationId)
        {
            return await _context
                .MarketTrends.Where(mt => mt.AiRecommendationId == aiRecommendationId)
                .OrderByDescending(mt => mt.StartDate)
                .ToListAsync();
        }
    }
}
