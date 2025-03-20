using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Profiles
{
    public class UserProfileMappingProfile : Profile
    {
        public UserProfileMappingProfile()
        {
            CreateMap<UserProfile, UserProfileDto>().ReverseMap();
        }
    }
}
