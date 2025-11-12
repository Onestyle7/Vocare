using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Billing.Models.Entities;

namespace VocareWebAPI.UserManagement.Repositories.Interfaces
{
    public interface IMarketingConsentRepository
    {
        Task<MarketingConsent?> GetByUserIdAsync(string userId);
        Task CreateAsync(MarketingConsent consent);
        Task UpdateAsync(MarketingConsent consent);
        Task<bool> HasActiveConsentAsync(string userId);
    }
}
