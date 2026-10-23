using Microsoft.Extensions.Options;
using VocareWebAPI.Billing.Configuration;
using VocareWebAPI.Billing.Constants;
using VocareWebAPI.Billing.Models.Dtos;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.Billing.Services.Implementations
{
    /// <summary>
    /// Rabat na jednorazowy zakup tokenów za zgodę marketingową. Przyznanie i wykorzystanie
    /// zapisujemy w TokenTransactions (Amount = 0), tak jak aktywację subskrypcji.
    /// </summary>
    public class ConsentDiscountService : IConsentDiscountService
    {
        private readonly ITokenTransactionRepository _tokenTransactionRepository;
        private readonly ConsentDiscountConfig _config;
        private readonly IPriorAccountService _priorAccountService;
        private readonly ILogger<ConsentDiscountService> _logger;

        public ConsentDiscountService(
            ITokenTransactionRepository tokenTransactionRepository,
            IPriorAccountService priorAccountService,
            IOptions<ConsentDiscountConfig> config,
            ILogger<ConsentDiscountService> logger
        )
        {
            _tokenTransactionRepository = tokenTransactionRepository;
            _priorAccountService = priorAccountService;
            _config = config.Value;
            _logger = logger;
        }

        public async Task<ConsentDiscountInfo?> GrantAsync(string userId)
        {
            if (!_config.IsEnabled)
                return null;

            var alreadyGranted = await _tokenTransactionRepository.HasTransactionOfTypeAsync(
                userId,
                TransactionType.ConsentDiscountGranted
            );
            if (alreadyGranted)
            {
                _logger.LogInformation(
                    "Consent discount already granted to user {UserId}, skipping",
                    userId
                );
                return null;
            }

            var priorAccount = await _priorAccountService.GetPriorAccountAsync(userId);
            if (priorAccount?.HadConsentDiscount == true)
            {
                _logger.LogWarning(
                    "Consent discount withheld for user {UserId}: discount already granted to a prior account with the same email",
                    userId
                );
                return null;
            }

            var grantedAt = DateTime.UtcNow;
            await _tokenTransactionRepository.AddTransactionAsync(
                new TokenTransaction
                {
                    UserId = userId,
                    ServiceName = TransactionServiceNames.ConsentDiscountGranted,
                    Type = TransactionType.ConsentDiscountGranted,
                    Amount = 0,
                    CreatedAt = grantedAt,
                }
            );

            _logger.LogInformation(
                "Granted {PercentOff}% consent discount to user {UserId}",
                _config.PercentOff,
                userId
            );
            return ToInfo(grantedAt);
        }

        public async Task<ConsentDiscountInfo?> GetActiveAsync(string userId)
        {
            if (!_config.IsEnabled)
                return null;

            var grantedAt = await _tokenTransactionRepository.GetFirstTransactionDateAsync(
                userId,
                TransactionType.ConsentDiscountGranted
            );
            if (grantedAt is null)
                return null;

            var info = ToInfo(grantedAt.Value);
            if (info.ExpiresAtUtc <= DateTime.UtcNow)
                return null;

            var redeemed = await _tokenTransactionRepository.HasTransactionOfTypeAsync(
                userId,
                TransactionType.ConsentDiscountRedeemed
            );
            return redeemed ? null : info;
        }

        public async Task MarkRedeemedAsync(string userId)
        {
            await _tokenTransactionRepository.AddTransactionAsync(
                new TokenTransaction
                {
                    UserId = userId,
                    ServiceName = TransactionServiceNames.ConsentDiscountRedeemed,
                    Type = TransactionType.ConsentDiscountRedeemed,
                    Amount = 0,
                    CreatedAt = DateTime.UtcNow,
                }
            );

            _logger.LogInformation("Consent discount redeemed by user {UserId}", userId);
        }

        private ConsentDiscountInfo ToInfo(DateTime grantedAtUtc) =>
            new(
                _config.CouponId,
                _config.PercentOff,
                DateTime.SpecifyKind(grantedAtUtc, DateTimeKind.Utc).AddDays(_config.ValidityDays)
            );
    }
}
