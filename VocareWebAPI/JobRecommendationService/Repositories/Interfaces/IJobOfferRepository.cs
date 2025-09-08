using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.JobRecommendationService.Models.Entities;

namespace VocareWebAPI.JobRecommendationService.Repositories.Interfaces
{
    public interface IJobOfferRepository
    {
        Task AddJobOffersAsync(List<JobOffer> offers);
        Task<List<JobOffer>> GetJobOffersByRecommendationIdAsync(Guid recommendationId);
        Task DeleteAllJobOffersForUserAsync(string userId);
        Task<List<JobOffer>> GetJobOffersByUserIdAsync(string userId);
    }
}
