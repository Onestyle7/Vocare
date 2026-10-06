using Hangfire;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Models.Enums;
using VocareWebAPI.UserManagement.Models.Results;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Services
{
    public class UserSetupService(
        IUserBillingRepository userBillingRepository,
        IOptions<UserRegistrationConfig> config,
        ILogger<UserSetupService> logger,
        IAccountAntiAbuseReporitory antiAbuseReporitory,
        IEmailHashService emailHashService,
        UserManager<User> userManager,
        ITokenTransactionRepository tokenTransactionRepository,
        IBackgroundJobClient backgroundJobClient
        ) : IUserSetupService
    {
        private readonly IUserBillingRepository _userBillingRepository = userBillingRepository;
        private readonly UserRegistrationConfig _config = config.Value;
        private readonly ILogger<UserSetupService> _logger = logger;
        private readonly IAccountAntiAbuseReporitory _antiAbuseRepository = antiAbuseReporitory;
        private readonly IEmailHashService _emailHashService = emailHashService;
        private readonly UserManager<User> _userManager = userManager;
        private readonly ITokenTransactionRepository _tokenTransactionRepository = tokenTransactionRepository;
        private readonly IBackgroundJobClient _backgroundJobClient = backgroundJobClient;
        private const string WelcomeBonusServiceName = "WelcomeBonus-MarketingConsent";

        public async Task SetupNewUserAsync(string userId)
        {
            try
            {
                var hadPriorAccount = await HadPriorAccount(userId);
                var initialTokenBalance = CalculateInitialTokens(hadPriorAccount);

                _logger.LogInformation("Setting up new user: {userId}", userId);
                _logger.LogInformation(
                    "Config - WelcomeTokens: {WelcomeTokens}, DefaultSubscriptionStatus: {DefaultSubscriptionStatus}, DefaultSubscriptionLevel: {DefaultSubscriptionLevel}",
                    initialTokenBalance,
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
                    if (tokensToAdd > 0 && !hadPriorAccount)
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
                    TokenBalance = initialTokenBalance,
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

        private async Task<bool> HadPriorAccount(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            var email = user?.Email;
            var hadPriorAccount = false;
            if (!string.IsNullOrWhiteSpace(email))
            {
                var emailHash = _emailHashService.ComputeHash(email);
                hadPriorAccount = await _antiAbuseRepository.HasPriorBonusAsync(emailHash);
                if (hadPriorAccount)
                {
                    _logger.LogWarning(
                        "Re-registration deteected for email hash: {emailHash}. Welcome tokens withheld for user: {userId}",
                        emailHash,
                        userId
                    );
                }
            }

            return hadPriorAccount;
        }

        private int CalculateInitialTokens(bool hadPriorAccount) => hadPriorAccount ? 0 : _config.WelcomeTokens;
    }
}
