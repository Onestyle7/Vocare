using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Models;

namespace VocareWebAPI.Repositories
{
    /// <summary>
    /// Repozytorium odpowiedzialne za operacje na rekomendacjach AI w bazie danych
    /// </summary>
    public class AiRecommendationRepository : IAiRecommendationRepository
    {
        private readonly AppDbContext _context;

        /// <summary>
        /// Inicjalizacja instancji repozytorium
        /// </summary>
        /// <param name="context"></param>
        public AiRecommendationRepository(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Dodaje nową rekomendację AI do bazy danych
        /// </summary>
        /// <param name="recommendation">Rekomendacja Ai do dodania</param>
        /// <returns>Task reprezentujący operację asynchroniczna</returns>
        public async Task AddRecommendationAsync(AiRecommendation recommendation)
        {
            await _context.AiRecommendations.AddAsync(recommendation);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Pobiera najnowszą rekomendację AI dla danego użytkownika
        /// </summary>
        /// <param name="userId">Id użytkownika</param>
        /// <returns>Najnowsza rekomendacja AI</returns>
        public async Task<AiRecommendation> GetLatestByUserIdAsync(string userId)
        {
            return await _context
                .AiRecommendations.Include(r => r.CareerPaths)
                .ThenInclude(cp => cp.SwotAnalysis)
                .Include(r => r.NextSteps)
                .FirstOrDefaultAsync(r => r.UserId == userId);
        }
    }
}
