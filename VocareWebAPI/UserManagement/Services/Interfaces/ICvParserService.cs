using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Dtos;

namespace VocareWebAPI.CareerAdvisor.Services.Interfaces
{
    public interface ICvParserService
    {
        Task<UserProfileDto> ParseAndSaveAsync(IFormFile file, string userId);
    }
}
