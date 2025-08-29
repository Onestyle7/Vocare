using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.JobRecommendationService.Models.Dtos.JobRecommendations;

namespace VocareWebAPI.JobRecommendationService.Services.Interfaces
{
    public interface IJobRecommendationService
    {
        Task<JobRecommendationsResponseDto> GetJobRecommendationsAsync(string userId);
        Task<bool> GenerateJobRecommendationsAsync(Guid recommendationId, List<string> careerPaths);
    }
}
