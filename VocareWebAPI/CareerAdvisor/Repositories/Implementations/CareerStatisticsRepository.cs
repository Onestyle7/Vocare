using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Polly;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities.MarketAnalysis;
using VocareWebAPI.Repositories.Interfaces;

namespace VocareWebAPI.Repositories.Implementations
{
    /// <summary>
    /// Repozytorium odpowiedzialne za operację na statystykach zawodowych w bazie danych
    /// </summary>
    public class CareerStatisticsRepository : ICareerStatisticsRepository
    {
        private readonly AppDbContext _context;

        /// <summary>
        /// Inicjalizuje instancję repozytorium
        /// </summary>
        /// <param name="context"></param>
        public CareerStatisticsRepository(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Dodaje nowe statystyki zawodowe do bazy danych
        /// </summary>
        /// <param name="entity">Statystyki zawodowe do dodania</param>
        /// <returns>Task reprezentujący operację asynchroniczną</returns>
        public async Task AddAsync(CareerStatistics entity)
        {
            await _context.CareerStatistics.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<List<CareerStatistics>> GetByAiRecommendationIdAsync(
            Guid aiRecommendationId
        )
        {
            return await _context
                .CareerStatistics.Where(cs => cs.AiRecommendationId == aiRecommendationId)
                .OrderByDescending(cs => cs.LastUpdated)
                .ToListAsync();
        }

        public async Task DeleteByAiRecommendationIdAsync(Guid aiRecommendationId)
        {
            var toDelete = _context.CareerStatistics.Where(cs =>
                cs.AiRecommendationId == aiRecommendationId
            );
            _context.CareerStatistics.RemoveRange(toDelete);
            await _context.SaveChangesAsync();
        }
    }
}
