using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Data;

namespace VocareWebAPI.Billing.Services.Implementations
{
    public class BillingService : IBillingService
    {
        private readonly AppDbContext _dbContext;
        private readonly IServiceCostRepository _serviceCostRepository;
        private readonly IUserBillingRepository _userBillingRepository;
        private readonly ITokenTransactionRepository _tokenTransactionRepository;
        private readonly string _webhookSecret;

        public BillingService(
            AppDbContext context,
            IServiceCostRepository serviceCostRepository,
            IUserBillingRepository userBillingRepository,
            ITokenTransactionRepository tokenTransactionRepository,
            IConfiguration configuration
        )
        {
            _dbContext = context;
            _serviceCostRepository = serviceCostRepository;
            _userBillingRepository = userBillingRepository;
            _tokenTransactionRepository = tokenTransactionRepository;
            _webhookSecret =
                configuration["Stripe:WebhookSecret"]
                ?? throw new ArgumentNullException(
                    nameof(configuration),
                    "WebhookSecret is not configured."
                );
        }

        public async Task<bool> CanAccessServiceAsync(string userId, string serviceName)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(serviceName))
            {
                throw new ArgumentException("User ID and service name cannot be null or empty.");
            }

            var serviceCost = await _serviceCostRepository.GetServiceCostAsync(serviceName);

            var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
            if (userBilling == null)
            {
                throw new KeyNotFoundException(
                    $"User billing information for user ID {userId} not found."
                );
            }

            if (userBilling.SubscriptionStatus == SubscriptionStatus.Active)
            {
                return true;
            }

            return userBilling.TokenBalance >= serviceCost;
        }

        public async Task DeductTokensForServiceAsync(string userId, string serviceName)
        {
            // 1️⃣ Walidacja argumentów
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(serviceName))
                throw new ArgumentException("User ID and service name cannot be null or empty.");

            // 2️⃣ Pobranie ceny usługi
            var serviceCost = await _serviceCostRepository.GetServiceCostAsync(serviceName);
            if (serviceCost <= 0)
                throw new InvalidOperationException(
                    $"Service cost for {serviceName} is not valid."
                );

            // 3️⃣ Pobranie danych billingowych użytkownika
            var userBilling = await _dbContext.UserBillings.FirstOrDefaultAsync(ub =>
                ub.UserId == userId
            );
            if (userBilling is null)
                throw new KeyNotFoundException(
                    $"User billing information for user ID {userId} not found."
                );

            // 4️⃣ Jeśli ma aktywną subskrypcję, nic nie robimy
            if (userBilling.SubscriptionStatus == SubscriptionStatus.Active)
                return;

            // 5️⃣ Sprawdzenie salda tokenów
            if (userBilling.TokenBalance < serviceCost)
                throw new InvalidOperationException(
                    $"User {userId} does not have enough tokens to access {serviceName}."
                );

            // 6️⃣ Rozpoczęcie transakcji, aby operacje były atomowe
            await using var trx = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                // 7️⃣ Aktualizacja salda
                userBilling.TokenBalance -= serviceCost;
                userBilling.LastTokenPurchaseDate = DateTime.UtcNow;
                // EF Core śledzi userBilling, więc nie musimy wywoływać Update()

                // 8️⃣ Dodanie zapisu transakcji
                var tokenTransaction = new TokenTransaction
                {
                    UserId = userId,
                    ServiceName = serviceName,
                    Type = TransactionType.Usage,
                    Amount = -serviceCost,
                    CreatedAt = DateTime.UtcNow,
                };
                await _dbContext.TokenTransactions.AddAsync(tokenTransaction);

                // 9️⃣ Zapis wszystkich zmian w jednym SaveChanges
                await _dbContext.SaveChangesAsync();

                // 🔟 Commit transakcji
                await trx.CommitAsync();
            }
            catch (Exception ex)
            {
                await trx.RollbackAsync();
                throw new InvalidOperationException("Failed to deduct tokens for service.", ex);
            }
        }

        public async Task HandleWebhookAsync(string json, string stripeSignature)
        {
            if (string.IsNullOrEmpty(json) || string.IsNullOrEmpty(stripeSignature))
                throw new ArgumentException("Invalid webhook payload or missing signature.");

            var stripeEvent = Stripe.EventUtility.ConstructEvent(
                json,
                stripeSignature,
                _webhookSecret,
                throwOnApiVersionMismatch: false
            );

            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                if (session?.Mode == "payment")
                {
                    var userId =
                        session.Metadata?["userId"]
                        ?? throw new InvalidOperationException("userId missing in metadata");

                    var ub = await _userBillingRepository.GetByUserIdAsync(userId);
                    if (ub == null)
                        throw new KeyNotFoundException($"No billing for {userId}");

                    await using var tx = await _dbContext.Database.BeginTransactionAsync();
                    try
                    {
                        const int tokensToAdd = 50;
                        await _userBillingRepository.AddTokensAsync(userId, tokensToAdd);

                        var tt = new TokenTransaction
                        {
                            UserId = userId,
                            ServiceName = "TokenPurchase",
                            Type = TransactionType.Purchase,
                            Amount = tokensToAdd,
                            CreatedAt = DateTime.UtcNow,
                        };
                        await _tokenTransactionRepository.AddTransactionAsync(tt);

                        await tx.CommitAsync();
                    }
                    catch
                    {
                        await tx.RollbackAsync();
                        throw;
                    }
                }
            }
        }

        public async Task<UserBilling> GetUserBillingAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));
            }
            var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
            if (userBilling == null)
            {
                throw new KeyNotFoundException(
                    $"User billing information for user ID {userId} not found."
                );
            }
            return userBilling;
        }
    }
}
