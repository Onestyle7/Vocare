using VocareWebAPI.MarketNews.Models.Dtos;

namespace VocareWebAPI.MarketNews.services.interfaces
{
    public interface IMarketPulseService
    {
        Task<MarketPulsePageDto> GetPagedAsync(
            int page,
            int pageSize,
            DateTime? from,
            DateTime? to
        );
        Task<MarketPulseDetailDto?> GetBySlugAsync(string slug);
        Task<MarketPulseDetailDto> CreateAsync(
            string title,
            string description,
            string content,
            string category,
            DateTime periodStart,
            DateTime periodEnd
        );
        Task<bool> ExistsForPeriodAsync(DateTime periodStart, DateTime periodEnd);
    }
}
