using AutoMapper;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Models.Enums;

namespace VocareWebAPI.Profiles
{
    ///<summary>
    /// Profil Automapper dla mapowania między encją UserProfile a UserProfileDto
    /// </summary>
    public class UserProfileMappingProfile : Profile
    {
        /// <summary>
        /// Inicjalizacja profilu mapowania
        /// </summary>
        public UserProfileMappingProfile()
        {
            CreateMap<UserProfile, UserProfileDto>()
                .ReverseMap()
                .ForMember(
                    dest => dest.PersonalityType,
                    opt => opt.MapFrom(src => src.PersonalityType)
                );
            CreateMap<PersonalityType, string>().ConvertUsing(x => x.ToString());
        }
    }
}
