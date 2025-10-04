using AutoMapper;
using VocareWebAPI.MarketNews.Models.Dtos;
using VocareWebAPI.MarketNews.Models.Entities;

namespace VocareWebAPI.MarketNews.Profiles
{
    public class MarketNewsProfile : Profile
    {
        public MarketNewsProfile()
        {
            CreateMap<MarketNewsEntity, MarketNewsListDto>();
            CreateMap<MarketNewsEntity, MarketNewsDetailDto>();
        }
    }
}
