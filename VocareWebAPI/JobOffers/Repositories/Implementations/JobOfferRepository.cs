using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Models.Dtos;
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

        public async Task<JobOffer?> GetByReferenceNumberAsync(
            string refNumber,
            JobOfferSource source
        )
        {
            return await _context.JobOffers.FirstOrDefaultAsync(x =>
                x.ReferenceNumber == refNumber && x.Source == source
            );
        }

        public async Task<IEnumerable<JobStaleInfo>> GetAllReferenceNumbersAsync(
            JobOfferSource source
        )
        {
            var activeJobs = await _context
                .JobOffers.Where(j => j.Source == source)
                .Select(p => new JobStaleInfo(p.ReferenceNumber, p.Source, p.UpdatedAt))
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

        public async Task<int> DeleteByReferenceNumberAsync(
            IEnumerable<string> refNumbers,
            JobOfferSource source
        )
        {
            var refList = refNumbers.ToList();

            return await _context
                .JobOffers.Where(j => j.Source == source)
                .Where(j => refList.Contains(j.ReferenceNumber))
                .ExecuteDeleteAsync();
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

        public async Task AddToContextAsync(JobOffer offer)
        {
            await _context.JobOffers.AddAsync(offer);
        }

        public void UpdateInContext(JobOffer offer, bool embeddingGenerated = false)
        {
            if (_context.Entry(offer).State == EntityState.Detached)
            {
                _context.JobOffers.Update(offer);
            }
            if (embeddingGenerated == false)
                _context.Entry(offer).Property(x => x.Embedding).IsModified = false;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public void ClearChangeTracker()
        {
            _context.ChangeTracker.Clear();
        }

        public async Task<JobOffer?> GetDetailsByIdAsync(Guid id)
        {
            return await _context
                .JobOffers.AsNoTracking()
                .Include(offer => offer.Skills)
                .FirstOrDefaultAsync(offer => offer.Id == id);
        }

        public async Task<Dictionary<string, JobOfferSnapshot>> GetSnapshotsBySourceAsync(
            JobOfferSource source
        )
        {
            return await _context
                .JobOffers.AsNoTracking()
                .Where(j => j.Source == source)
                .Select(j => new JobOfferSnapshot(
                    j.Id,
                    j.ReferenceNumber,
                    j.Source,
                    j.Title,
                    j.CompanyName,
                    j.Url,
                    j.Country,
                    j.Category,
                    j.SeniorityLevel,
                    j.JobType,
                    j.Description,
                    j.BriefDescription,
                    j.SalaryMin,
                    j.SalaryMax,
                    j.SalaryCurrency,
                    j.SalaryPeriod,
                    j.PublishedAt,
                    j.Embedding != null
                ))
                .ToDictionaryAsync(s => s.ReferenceNumber);
        }

        public async Task<JobOffer?> GetTrackedByIdAsync(Guid id)
        {
            return await _context.JobOffers.FirstOrDefaultAsync(j => j.Id == id);
        }
    }
}
