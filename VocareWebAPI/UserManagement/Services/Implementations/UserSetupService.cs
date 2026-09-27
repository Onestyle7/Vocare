using Microsoft.Extensions.Options;
using VocareWebAPI.Billing.Exceptions;
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
        private readonly ITokenTransactionRepository _tokenTransactionRepository;
        private const string WelcomeBonusServiceName = "WelcomeBonus-MarketingConsent";

        public UserSetupService(
            IUserBillingRepository userBillingRepository,
            IOptions<UserRegistrationConfig> config,
            ITokenTransactionRepository tokenTransactionRepository,
            ILogger<UserSetupService> logger
        )
        {
            _userBillingRepository = userBillingRepository;
            _config = config.Value;
            _tokenTransactionRepository = tokenTransactionRepository;
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
                catch (UserBillingNotFoundException)
                {
                    _logger.LogInformation("UserBilling not found for user: {UserId}", userId);
                }

                if (existingBilling != null)
                {
                    _logger.LogInformation("UserBilling already exists for user: {UserId}", userId);

                    return;
                }
                // Tworzenie nowego billing dla nowego użytkownika
                var userBilling = new UserBilling
                {
                    UserId = userId,
                    TokenBalance = 0,
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

        public async Task<int> GrantWelcomeTokensAsync(string userId)
        {
            if (_config.WelcomeTokens <= 0)
                return 0;

            var alreadyTaken = await _tokenTransactionRepository.HasTransactionOfTypeAsync(
                userId,
                TransactionType.WelcomeBonus
            );
            if (alreadyTaken)
            {
                _logger.LogInformation("User {UserId} already received welcome bonus", userId);
                return 0;
            }
            try
            {
                await _userBillingRepository.AddTokensWithTransactionAsync(
                    userId,
                    _config.WelcomeTokens,
                    TransactionType.WelcomeBonus,
                    WelcomeBonusServiceName
                );
                _logger.LogInformation(
                    "Granted {Amount} welcome tokens to user {UserId}",
                    _config.WelcomeTokens,
                    userId
                );
            }
            catch (WelcomeBonusAlreadyGrantedException)
            {
                _logger.LogInformation(
                    "User {UserId} already received welcome bonus (concurrent request)",
                    userId
                );
                return 0;
            }

            return _config.WelcomeTokens;
        }
    }
}
