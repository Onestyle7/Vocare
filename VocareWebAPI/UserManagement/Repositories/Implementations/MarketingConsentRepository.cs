using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Data;
using VocareWebAPI.UserManagement.Repositories.Interfaces;

namespace VocareWebAPI.UserManagement.Repositories.Implementations
{
    public class MarketingConsentRepository : IMarketingConsentRepository
    {
        private readonly AppDbContext _context;

        public MarketingConsentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MarketingConsent?> GetByUserIdAsync(string userId)
        {
            return await _context.MarketingConsents.FirstOrDefaultAsync(c => c.UserId == userId);
        }

        public async Task CreateAsync(MarketingConsent consent)
        {
            _context.MarketingConsents.Add(consent);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(MarketingConsent consent)
        {
            _context.Entry(consent).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task<bool> HasActiveConsentAsync(string userId)
        {
            var consent = await _context
                .MarketingConsents.AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == userId);

            return consent?.IsConsentGiven ?? false;
        }
    }
}
