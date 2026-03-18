using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VocareWebAPI.Billing.Models.Config;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Data;

namespace VocareWebAPI.Billing.Services.Implementations
{
    public class DeveloperAccessService : IDeveloperAccessService
    {
        private readonly DeveloperAccessConfig _config;
        private readonly AppDbContext _dbContext;
        private readonly IHostEnvironment _hostEnvironment;

        public DeveloperAccessService(
            IOptions<DeveloperAccessConfig> config,
            AppDbContext dbContext,
            IHostEnvironment hostEnvironment
        )
        {
            _config = config.Value;
            _dbContext = dbContext;
            _hostEnvironment = hostEnvironment;
        }

        public async Task<bool> HasPremiumOverrideAsync(string userId)
        {
            if (
                !_hostEnvironment.IsDevelopment()
                || !_config.ForcePremiumEnabled
                || string.IsNullOrWhiteSpace(userId)
            )
            {
                return false;
            }

            if (ContainsMatch(_config.ForcePremiumUserIds, userId))
            {
                return true;
            }

            if (_config.ForcePremiumEmails.Count == 0)
            {
                return false;
            }

            var email = await _dbContext
                .Users.Where(user => user.Id == userId)
                .Select(user => user.Email)
                .FirstOrDefaultAsync();

            return !string.IsNullOrWhiteSpace(email) && ContainsMatch(_config.ForcePremiumEmails, email);
        }

        public UserBilling ApplyPremiumOverride(UserBilling userBilling)
        {
            return new UserBilling
            {
                UserId = userBilling.UserId,
                TokenBalance = userBilling.TokenBalance,
                StripeCustomerId = userBilling.StripeCustomerId,
                StripeSubscriptionId = userBilling.StripeSubscriptionId,
                SubscriptionStatus = SubscriptionStatus.Active,
                SubscriptionLevel = SubscriptionLevel.Monthly,
                LastTokenPurchaseDate = userBilling.LastTokenPurchaseDate,
                SubscriptionEndDate = userBilling.SubscriptionEndDate ?? DateTime.UtcNow.AddYears(10),
            };
        }

        private static bool ContainsMatch(IEnumerable<string> values, string candidate)
        {
            var normalizedCandidate = candidate.Trim();

            return values.Any(value =>
                !string.IsNullOrWhiteSpace(value)
                && string.Equals(value.Trim(), normalizedCandidate, StringComparison.OrdinalIgnoreCase)
            );
        }
    }
}
