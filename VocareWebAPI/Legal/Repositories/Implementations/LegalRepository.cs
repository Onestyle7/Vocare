using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Legal.Models.Entities;
using VocareWebAPI.Legal.Repositories.Interfaces;

namespace VocareWebAPI.Legal.Repositories.Implementations
{
    public class LegalRepository(AppDbContext context) : ILegalRepository
    {
        private readonly AppDbContext _context = context;

        public async Task AddConsentsAsync(IEnumerable<UserConsent> consents)
        {
            await _context.UserConsents.AddRangeAsync(consents);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Guid>> GetAcceptedDocumentIdsAsync(string userId)
        {
            return await _context
                .UserConsents.AsNoTracking()
                .Where(uc => uc.UserId == userId)
                .Select(uc => uc.LegalDocumentId)
                .ToListAsync();
        }

        public async Task<List<LegalDocument>> GetActiveDocumentsAsync()
        {
            return await _context
                .LegalDocuments.AsNoTracking()
                .Where(d => d.IsActive)
                .ToListAsync();
        }

        public async Task AddCookieConsentRecordAsync(CookieConsentRecord record)
        {
            _context.CookieConsentRecords.Add(record);
            await _context.SaveChangesAsync();
        }

        public async Task<int> DeleteCookieConsentRecordsOlderThanAsync(DateTime cutoffUtc)
        {
            var expired = await _context
                .CookieConsentRecords.Where(r => r.CreatedAt < cutoffUtc)
                .ToListAsync();

            _context.CookieConsentRecords.RemoveRange(expired);
            await _context.SaveChangesAsync();

            return expired.Count;
        }
    }
}
