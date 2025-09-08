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
        private readonly ILogger<JobOfferRepository> _logger;

        public JobOfferRepository(AppDbContext context, ILogger<JobOfferRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task AddJobOffersAsync(List<JobOffer> offers)
        {
            if (offers.Any())
            {
                var userId = offers.First().UserId;

                _logger.LogInformation(
                    "Adding {Count} job offers for user {UserId}",
                    offers.Count,
                    userId
                );

                await DeleteAllJobOffersForUserAsync(userId);

                await _context.JobOffers.AddRangeAsync(offers);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Successfully replaced all offers with {Count} new offers for user {UserId}",
                    offers.Count,
                    userId
                );
            }
        }

        public async Task<List<JobOffer>> GetJobOffersByRecommendationIdAsync(Guid recommendationId)
        {
            return await _context
                .JobOffers.Where(jo => jo.AiRecommendationId == recommendationId)
                .OrderByDescending(jo => jo.CreatedAt)
                .ToListAsync();
        }

        public async Task DeleteAllJobOffersForUserAsync(string userId)
        {
            _logger.LogInformation("Deleting ALL offers for user {UserId}", userId);

            var userOffers = await _context
                .JobOffers.Where(jo => jo.UserId == userId)
                .ToListAsync();

            _logger.LogInformation(
                "Found {Count} offers to delete for user {UserId}",
                userOffers.Count,
                userId
            );

            _context.JobOffers.RemoveRange(userOffers);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Deleted {Count} offers for user {UserId}",
                userOffers.Count,
                userId
            );
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
