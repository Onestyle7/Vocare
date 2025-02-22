using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareAPI.Application.DTOs;

namespace VocareAPI.Application.Services.Interfaces
{
    public interface IRecommendationHistoryService
    {
        Task SaveRecommendationAsync(Guid userId, string recommendationText);
        Task<IEnumerable<RecommendationHistoryDto>> GetRecommendationsForUserAsync(Guid userId);
    }
}