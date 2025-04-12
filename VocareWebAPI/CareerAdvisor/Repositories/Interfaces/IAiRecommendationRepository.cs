using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models;

namespace VocareWebAPI.Repositories
{
    public interface IAiRecommendationRepository
    {
        Task AddRecommendationAsync(AiRecommendation recommendation);
        Task<AiRecommendation> GetLatestByUserIdAsync(string userId);
    }
}
