using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Billing.Models.Entities;

namespace VocareWebAPI.Billing.Repositories.Interfaces
{
    public interface IUserBillingRepository
    {
        Task<UserBilling> GetByUserIdAsync(string userId);
        Task<UserBilling> CreateAsync(UserBilling userBilling);
        Task UpdateAsync(UserBilling userBilling);
        Task<bool> HasEnoughTokensAsync(string userId, int requiredTokens);
        Task DeductTokensAsync(string userId, int amount);
        Task AddTokensAsync(string userId, int amount);
    }
}
