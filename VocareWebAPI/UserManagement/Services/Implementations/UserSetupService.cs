using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Models.Entities;

namespace VocareWebAPI.UserManagement.Services
{
    public class UserSetupService : IUserSetupService
    {
        private readonly IUserBillingRepository _userBillingRepository;
        private readonly UserRegistrationConfig _config;
        private readonly ILogger<UserSetupService> _logger;

        public UserSetupService(
            IUserBillingRepository userBillingRepository,
            IOptions<UserRegistrationConfig> config,
            ILogger<UserSetupService> logger
        )
        {
            _userBillingRepository = userBillingRepository;
            _config = config.Value;
            _logger = logger;
        }

        public async Task SetupNewUserAsync(string userId)
        {
            try
            {
                _logger.LogInformation($"Setting up new user: {userId}");

                try
                {
                    var existingBilling = await _userBillingRepository.GetByUserIdAsync(userId);
                    _logger.LogWarning("UserBilling already exists for user: {UserId}", userId);
                    return;
                }
                catch (KeyNotFoundException) { }

                var userBilling = new UserBilling
                {
                    UserId = userId,
                    TokenBalance = _config.WelcomeTokens,
                    SubscriptionStatus = (SubscriptionStatus)_config.DefaultSubscriptionStatus,
                    SubscriptionLevel = (SubscriptionLevel)_config.DefaultSubscriptionLevel,
                    LastTokenPurchaseDate = DateTime.UtcNow,
                    StripeCustomerId = null,
                    StripeSubscriptionId = null,
                    SubscriptionEndDate = null,
                };
                await _userBillingRepository.CreateAsync(userBilling);
                _logger.LogInformation("UserBilling created for user: {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogInformation(ex, "Created UserBilling for user: {UserId} failed", userId);
            }
        }
    }
}
