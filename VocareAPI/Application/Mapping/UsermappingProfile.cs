using AutoMapper;
using Microsoft.VisualBasic;
using VocareAPI.Application.DTOs;
using VocareAPI.Core.Entities;

namespace VocareAPI.Application.Mapping
{
    public class UsermappingProfile : Profile
    {
        public UsermappingProfile()
        {
            CreateMap<RegisterDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());
            CreateMap<LoginDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());
            CreateMap<UserProfile, UserProfileDto>().ReverseMap();
            CreateMap<RecommendationHistory, RecommendationHistoryDto>().ReverseMap();
        }
    }
}