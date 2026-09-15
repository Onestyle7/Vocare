using AutoMapper;
using VocareWebAPI.MarketNews.Models.Dtos;
using VocareWebAPI.MarketNews.Models.Entities;

namespace VocareWebAPI.MarketNews.Profiles
{
    public class MarketPulseProfile : Profile
    {
        public MarketPulseProfile()
        {
            CreateMap<MarketPulsePost, MarketPulseListItemDto>();
            CreateMap<MarketPulsePost, MarketPulseDetailDto>();
        }
    }
}
