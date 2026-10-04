using Hangfire;
using Microsoft.Extensions.Options;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Models.Enums;
using VocareWebAPI.UserManagement.Models.Results;

namespace VocareWebAPI.UserManagement.Services
{
    public class UserSetupService : IUserSetupService
    {
        private readonly IUserBillingRepository _userBillingRepository;
        private readonly UserRegistrationConfig _config;
        private readonly ILogger<UserSetupService> _logger;
        private readonly ITokenTransactionRepository _tokenTransactionRepository;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private const string WelcomeBonusServiceName = "WelcomeBonus-MarketingConsent";

        public UserSetupService(
            IUserBillingRepository userBillingRepository,
            IOptions<UserRegistrationConfig> config,
            ITokenTransactionRepository tokenTransactionRepository,
            ILogger<UserSetupService> logger,
            IBackgroundJobClient backgroundJobClient
        )
        {
            _userBillingRepository = userBillingRepository;
            _config = config.Value;
            _tokenTransactionRepository = tokenTransactionRepository;
            _backgroundJobClient = backgroundJobClient;
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

        public async Task<WelcomeBonusResult> GrantWelcomeTokensAsync(string userId)
        {
            if (_config.WelcomeTokens <= 0)
                return new WelcomeBonusResult(WelcomeBonusStatus.Disabled, 0);

            var alreadyTaken = await _tokenTransactionRepository.HasTransactionOfTypeAsync(
                userId,
                TransactionType.WelcomeBonus
            );
            if (alreadyTaken)
            {
                _logger.LogInformation("User {UserId} already received welcome bonus", userId);
                return new WelcomeBonusResult(WelcomeBonusStatus.AlreadyClaimed, 0);
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
                return new WelcomeBonusResult(WelcomeBonusStatus.AlreadyClaimed, 0);
            }

            return new WelcomeBonusResult(WelcomeBonusStatus.Granted, _config.WelcomeTokens);
        }

        public async Task<WelcomeBonusResult> GrantOrScheduleWelcomeTokensAsync(string userId)
        {
            try
            {
                var result = await GrantWelcomeTokensAsync(userId);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd przypisania tokenów {UserId}", userId);
                try
                {
                    _backgroundJobClient.Enqueue<IUserSetupService>(s =>
                        s.GrantWelcomeTokensAsync(userId)
                    );

                    return new WelcomeBonusResult(WelcomeBonusStatus.Pending, 0);
                }
                catch (Exception ex2)
                {
                    _logger.LogError(ex2, "Failed to grant tokens for user {UserId}", userId);
                    return new WelcomeBonusResult(WelcomeBonusStatus.Failed, 0);
                }
            }
        }
    }
}
