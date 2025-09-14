using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using VocareWebAPI.MarketNewsService.Models.Dtos;
using VocareWebAPI.MarketNewsService.Models.Entities;

namespace VocareWebAPI.MarketNewsService.Profiles
{
    public class MarketNewsProfile : Profile
    {
        public MarketNewsProfile()
        {
            CreateMap<MarketNews, MarketNewsListDto>();
            CreateMap<MarketNews, MarketNewsDetailDto>();
        }
    }
}
