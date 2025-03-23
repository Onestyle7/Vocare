using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Services
{
    public interface IAiService
    {
        Task<AiCareerResponseDto> GetCareerRecommendationsAsync(UserProfile profile);
        Task<AiCareerResponseDto> GetLastRecommendationAsync(string userId);
    }
}
