using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Models.Records;
using VocareWebAPI.JobOffers.Repositories.Interfaces;

namespace VocareWebAPI.JobOffers.Repositories.Implementations
{
    public class JobOfferRepository : IJobOfferRepository
    {
        private readonly AppDbContext _context;

        public JobOfferRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<JobOffer?> GetByReferenceNumberAsync(string refNumber, JobOfferSource source)
        {
            return await _context.JobOffers.FirstOrDefaultAsync(x =>
                x.ReferenceNumber == refNumber && x.Source == source
            );
        }

        public async Task<IEnumerable<JobStaleInfo>> GetAllReferenceNumbersAsync(JobOfferSource source)
        {
            var activeJobs = await _context
                .JobOffers
                .Where(j => j.Source == source)
                .Select(p => new JobStaleInfo(p.ReferenceNumber,p.Source, p.UpdatedAt))
                .ToListAsync();

            return activeJobs;
        }

        public async Task AddAsync(JobOffer offer)
        {
            await _context.JobOffers.AddAsync(offer);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(JobOffer offer)
        {
            
            if (_context.Entry(offer).State == EntityState.Detached)
            {
                _context.JobOffers.Update(offer);
            }

            _context.Entry(offer).Property(x => x.Embedding).IsModified = false;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteByReferenceNumberAsync(IEnumerable<string> refNumbers, JobOfferSource source)
        {
            var toDelete = await _context
                .JobOffers.Where(j => refNumbers.Contains(j.ReferenceNumber))
                .Where(j => j.Source == source)
                .ToListAsync();

            _context.JobOffers.RemoveRange(toDelete);
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetCountAsync()
        {
            return await _context.JobOffers.CountAsync();
        }

        public async Task<List<JobOffer>> GetOffersWithoutEmbeddingAsync(int limit)
        {
            return await _context
                .JobOffers.Where(j => j.Embedding == null)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<int> CountOffersWithoutEmbeddingAsync()
        {
            return await _context.JobOffers.CountAsync(j => j.Embedding == null);
        }

        public async Task<List<string>> GetAllUniqueSkillNamesAsync()
        {
            return await _context
                .JobOffers.Where(j => j.Skills != null)
                .SelectMany(j => j.Skills!)
                .Select(s => s.Name)
                .Distinct()
                .ToListAsync();
        }
    }
}
