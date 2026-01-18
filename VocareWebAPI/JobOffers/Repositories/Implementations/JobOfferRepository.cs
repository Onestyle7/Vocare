using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Repositories.Interfaces;

namespace VocareWebAPI.JobOffers.Repositories.Implementations
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

        public async Task<JobOffer?> GetByReferenceNumberAsync(string refNumber)
        {
            return await _context.JobOffers.FirstOrDefaultAsync(x =>
                x.ReferenceNumber == refNumber
            );
        }

        public async Task<IEnumerable<string>> GetAllReferenceNumbersAsync()
        {
            return await _context.JobOffers.Select(j => j.ReferenceNumber).ToListAsync();
        }

        public async Task AddAsync(JobOffer offer)
        {
            await _context.JobOffers.AddAsync(offer);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(JobOffer offer)
        {
            _context.JobOffers.Update(offer);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteByReferenceNumberAsync(IEnumerable<string> refNumbers)
        {
            var toDelete = await _context
                .JobOffers.Where(j => refNumbers.Contains(j.ReferenceNumber))
                .ToListAsync();

            _context.JobOffers.RemoveRange(toDelete);
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetCountAsync()
        {
            return await _context.JobOffers.CountAsync();
        }
    }
}
