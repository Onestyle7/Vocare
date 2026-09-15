using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.MarketNews.Models.Entities;
using VocareWebAPI.MarketNews.repositories.Interfaces;

namespace VocareWebAPI.MarketNews.Repositories.Implementations
{
    public class MarketPulseRepository : IMarketPulseRepository
    {
        private readonly AppDbContext _context;

        public MarketPulseRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MarketPulsePost> AddAsync(MarketPulsePost post)
        {
            var news = _context.MarketPulsePosts.Add(post);
            await _context.SaveChangesAsync();
            return news.Entity;
        }

        public async Task<MarketPulsePost?> GetBySlugAsync(string slug)
        {
            return await _context.MarketPulsePosts.Where(p => p.Slug == slug).FirstOrDefaultAsync();
        }

        public async Task<(List<MarketPulsePost> Posts, int TotalCount)> GetPagedAsync(
            int page,
            int pageSize,
            DateTime? from,
            DateTime? to
        )
        {
            var filtered = _context.MarketPulsePosts.Where(p =>
                (!from.HasValue || p.PeriodEnd >= from.Value)
                && (!to.HasValue || p.PeriodStart <= to.Value)
            );

            var totalCount = await filtered.CountAsync();

            var news = await filtered
                .OrderByDescending(p => p.PublishedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (news, totalCount);
        }

        public async Task<bool> ExistsForPeriodAsync(DateTime periodStart, DateTime periodEnd)
        {
            return await _context.MarketPulsePosts.AnyAsync(p =>
                p.PeriodStart == periodStart && p.PeriodEnd == periodEnd
            );
        }
    }
}
