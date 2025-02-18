using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareAPI.Application.DTOs;

namespace VocareAPI.Application.Services.Interfaces
{
    public interface IProfileService
    {
        Task SaveUserProfileAsync(UserProfileDto userProfileDto);
    }
}