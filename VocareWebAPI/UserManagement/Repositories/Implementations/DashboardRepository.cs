using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Repositories.Interfaces;

namespace VocareWebAPI.UserManagement.Repositories.Implementations
{
    public class DashboardRepository : IDashboardRepository
    {
        private readonly AppDbContext _context;

        public DashboardRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetAnalysesCountAsync(string userId)
        {
            return await _context
                .AiRecommendations.Where(r => r.UserId == userId)
                .SumAsync(r => r.MarketAnalysisCount);
        }

        public async Task<int> GetCvsCountAsync(string userId)
        {
            return await _context.GeneratedCvs.CountAsync(cv => cv.UserId == userId);
        }

        public async Task<FinancialSurvey?> GetFinancialSurveyAsync(string userId)
        {
            return await _context
                .FinancialSurveys.Where(s => s.UserId == userId)
                .FirstOrDefaultAsync();
        }

        public async Task<int> GetRecommendationsCountAsync(string userId)
        {
            return await _context.AiRecommendations.CountAsync(r => r.UserId == userId);
        }

        public async Task<int> GetRoadmapsCountAsync(string userId)
        {
            return await _context.Roadmaps.CountAsync(r => r.UserId == userId);
        }
    }
}
