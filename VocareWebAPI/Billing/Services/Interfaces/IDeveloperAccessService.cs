using VocareWebAPI.Billing.Models.Entities;

namespace VocareWebAPI.Billing.Services.Interfaces
{
    public interface IDeveloperAccessService
    {
        Task<bool> HasPremiumOverrideAsync(string userId);
        UserBilling ApplyPremiumOverride(UserBilling userBilling);
    }
}
