using AutoMapper;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Models.Enums;

namespace VocareWebAPI.Profiles
{
    public class UserProfileMappingProfile : Profile
    {
        ///<summary>
        ///
        /// </summary>
        public UserProfileMappingProfile()
        {
            CreateMap<UserProfile, UserProfileDto>().ReverseMap();
        }
    }
}
