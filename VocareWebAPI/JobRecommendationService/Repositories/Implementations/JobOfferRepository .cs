using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.JobRecommendationService.Models.Entities;
using VocareWebAPI.JobRecommendationService.Repositories.Interfaces;

namespace VocareWebAPI.JobRecommendationService.Repositories.Implementations
{
    public class JobOfferRepository : IJobOfferRepository
    {
        private readonly AppDbContext _context;

        public JobOfferRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddJobOffersAsync(List<JobOffer> offers)
        {
            if (offers.Any())
            {
                var userId = offers.First().UserId;
                var currentRecommendationId = offers.First().AiRecommendationId;

                // usuwamy najpierw stare oferty pracy (potencjalnie nieaktualne)
                await DeleteOldJobOffersForUserAsync(userId, currentRecommendationId);

                // Następnie dodajemy nowo wygenerowane oferty pracy
                await _context.JobOffers.AddRangeAsync(offers);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<JobOffer>> GetJobOffersByRecommendationIdAsync(Guid recommendationId)
        {
            return await _context
                .JobOffers.Where(jo => jo.AiRecommendationId == recommendationId)
                .OrderByDescending(jo => jo.CreatedAt)
                .ToListAsync();
        }

        public async Task DeleteOldJobOffersForUserAsync(
            string userId,
            Guid currentRecommendationId
        )
        {
            var oldOffers = await _context
                .JobOffers.Where(jo =>
                    jo.UserId == userId && jo.AiRecommendationId != currentRecommendationId
                )
                .ToListAsync();

            _context.JobOffers.RemoveRange(oldOffers);
            await _context.SaveChangesAsync();
        }

        public async Task<List<JobOffer>> GetJobOffersByUserIdAsync(string userId)
        {
            return await _context
                .JobOffers.Where(jo => jo.UserId == userId)
                .OrderByDescending(jo => jo.CreatedAt)
                .ToListAsync();
        }
    }
}
