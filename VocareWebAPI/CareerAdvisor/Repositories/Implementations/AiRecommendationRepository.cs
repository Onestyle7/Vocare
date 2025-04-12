using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Models;

namespace VocareWebAPI.Repositories
{
    public class AiRecommendationRepository : IAiRecommendationRepository
    {
        private readonly AppDbContext _context;

        public AiRecommendationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddRecommendationAsync(AiRecommendation recommendation)
        {
            await _context.AiRecommendations.AddAsync(recommendation);
            await _context.SaveChangesAsync();
        }

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
