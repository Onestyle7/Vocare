using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.MarketNews.Models.Entities;
using VocareWebAPI.MarketNews.Repositories.Interfaces;

namespace VocareWebAPI.MarketNews.Repositories.Implementations
{
    public class MarketNewsRepository : IMarketNewsRepository
    {
        private readonly AppDbContext _context;

        public MarketNewsRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MarketNewsEntity> AddAsync(MarketNewsEntity marketNews)
        {
            var news = _context.MarketNews.Add(marketNews);
            await _context.SaveChangesAsync();
            return news.Entity;
        }

        public async Task<bool> ExistsForDateAsync(DateTime date)
        {
            var isExist = await _context.MarketNews.AnyAsync(n => n.CreatedAt.Date == date.Date);
            return isExist;
        }

        public async Task<(List<MarketNewsEntity> news, int totalCount)> GetAllPagedAsync(
            int page,
            int pageSize
        )
        {
            var query = _context.MarketNews.AsQueryable();
            var totalCount = await query.CountAsync();
            var news = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            return (news, totalCount);
        }

        public async Task<MarketNewsEntity?> GetByIdAsync(Guid id)
        {
            return await _context.MarketNews.Where(n => n.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<MarketNewsEntity>> GetLatest3Async()
        {
            var latest3News = await _context
                .MarketNews.OrderByDescending(n => n.CreatedAt)
                .Take(3)
                .ToListAsync();

            return latest3News;
        }

        public async Task<MarketNewsEntity?> GetLatestAsync()
        {
            var latestNews = await _context
                .MarketNews.OrderByDescending(n => n.CreatedAt)
                .FirstOrDefaultAsync();

            return latestNews;
        }
    }
}
