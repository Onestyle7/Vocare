using VocareWebAPI.MarketNews.Models.Entities;

namespace VocareWebAPI.MarketNews.repositories.Interfaces
{
    public interface IMarketPulseRepository
    {
        Task<(List<MarketPulsePost> Posts, int TotalCount)> GetPagedAsync(
            int page,
            int pageSize,
            DateTime? from,
            DateTime? to
        );
        Task<MarketPulsePost?> GetBySlugAsync(string slug);
        Task<MarketPulsePost> AddAsync(MarketPulsePost post);
        Task<bool> ExistsForPeriodAsync(DateTime periodStart, DateTime periodEnd);
    }
}
