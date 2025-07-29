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
                _logger.LogInformation(
                    "Config - WelcomeTokens: {WelcomeTokens}, DefaultSubscriptionStatus: {DefaultSubscriptionStatus}, DefaultSubscriptionLevel: {DefaultSubscriptionLevel}",
                    _config.WelcomeTokens,
                    _config.DefaultSubscriptionStatus,
                    _config.DefaultSubscriptionLevel
                );
                UserBilling? existingBilling = null;

                try
                {
                    existingBilling = await _userBillingRepository.GetByUserIdAsync(userId);
                    _logger.LogInformation("found existing UserBilling for user: {UserId}", userId);
                }
                catch (KeyNotFoundException)
                {
                    _logger.LogInformation("UserBilling not found for user: {UserId}", userId);
                }

                if (existingBilling != null)
                {
                    _logger.LogInformation("UserBilling already exists for user: {UserId}", userId);

                    // Sprawdzamy czy ma już tokeny welcome
                    if (existingBilling.TokenBalance >= _config.WelcomeTokens)
                    {
                        _logger.LogInformation(
                            "User {userId} already has enough tokens: {TokenBalance}",
                            userId,
                            existingBilling.TokenBalance
                        );
                        return;
                    }

                    // Jeśli ma mniej niż welcome tokens, to ustawiamy mu je

                    var tokensToAdd = Math.Max(
                        0,
                        _config.WelcomeTokens - existingBilling.TokenBalance
                    );
                    if (tokensToAdd > 0)
                    {
                        existingBilling.TokenBalance += tokensToAdd;
                        await _userBillingRepository.UpdateAsync(existingBilling);
                        _logger.LogInformation(
                            "Added {TokensToAdd} welcome tokens to user: {UserId}",
                            tokensToAdd,
                            userId
                        );
                    }
                    return;
                }
                // Tworzenie nowego billing dla nowego użytkownika
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
                _logger.LogInformation("Creating new UserBilling for user: {UserId}", userId);
                await _userBillingRepository.CreateAsync(userBilling);
                _logger.LogInformation("UserBilling created for user: {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogInformation(ex, "Created UserBilling for user: {UserId} failed", userId);
                throw;
            }
        }
    }
}
