using AutoMapper;
using VocareWebAPI.MarketNews.Models.Dtos;
using VocareWebAPI.MarketNews.Models.Entities;
using VocareWebAPI.MarketNews.repositories.Interfaces;
using VocareWebAPI.MarketNews.services.interfaces;

namespace VocareWebAPI.MarketNews.services.Implementations
{
    public class MarketPulseService : IMarketPulseService
    {
        private readonly IMarketPulseRepository _marketPulseRepository;
        private readonly ILogger<MarketPulseService> _logger;
        private readonly IMapper _mapper;

        public MarketPulseService(
            IMarketPulseRepository marketPulseRepository,
            ILogger<MarketPulseService> logger,
            IMapper mapper
        )
        {
            _marketPulseRepository = marketPulseRepository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<MarketPulseDetailDto> CreateAsync(
            string title,
            string description,
            string content,
            string category,
            DateTime periodStart,
            DateTime periodEnd
        )
        {
            var slug = $"{title.ToLower().Replace(" ", "-")}-{periodEnd:yyyy-MM-dd}";
            var post = new MarketPulsePost
            {
                Title = title,
                Description = description,
                Content = content,
                Category = category,
                PeriodStart = periodStart,
                PeriodEnd = periodEnd,
                Slug = slug,
                PublishedAt = DateTime.UtcNow,
            };

            await _marketPulseRepository.AddAsync(post);
            return _mapper.Map<MarketPulseDetailDto>(post);
        }

        public async Task<MarketPulseDetailDto?> GetBySlugAsync(string slug)
        {
            var post = await _marketPulseRepository.GetBySlugAsync(slug);
            if (post == null)
            {
                _logger.LogWarning("MarketPulsePost with slug {Slug} not found.", slug);
                return null;
            }
            return _mapper.Map<MarketPulseDetailDto>(post);
        }

        public async Task<MarketPulsePageDto> GetPagedAsync(
            int page,
            int pageSize,
            DateTime? from,
            DateTime? to
        )
        {
            var (posts, totalCount) = await _marketPulseRepository.GetPagedAsync(
                page,
                pageSize,
                from,
                to
            );
            var itemsDto = _mapper.Map<List<MarketPulseListItemDto>>(posts);

            return new MarketPulsePageDto
            {
                Items = itemsDto,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
            };
        }

        public async Task<bool> ExistsForPeriodAsync(DateTime periodStart, DateTime periodEnd)
        {
            var exists = await _marketPulseRepository.ExistsForPeriodAsync(periodStart, periodEnd);

            return exists;
        }
    }
}
