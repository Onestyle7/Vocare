namespace VocareWebAPI.MarketNews.Models.Dtos
{
    /// <summary>
    /// Dto dla paginacji (web)
    /// </summary>
    public class MarketNewsPagedDto
    {
        public List<MarketNewsListDto> News { get; set; } = new();
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public int TotalCount { get; set; } = 0;
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasNextPage => Page < TotalPages;
        public bool HasPreviousPage => Page > 1;
    }
}
