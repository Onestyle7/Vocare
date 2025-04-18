using Microsoft.EntityFrameworkCore;
using Stripe;
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
            if (string.IsNullOrEmpty(json))
            {
                throw new ArgumentException(
                    "Webhook payload cannot be null or empty.",
                    nameof(json)
                );
            }

            if (string.IsNullOrEmpty(stripeSignature))
            {
                throw new ArgumentException(
                    "Stripe signature cannot be null or empty.",
                    nameof(stripeSignature)
                );
            }

            Event stripeEvent;
            try
            {
                stripeEvent = Stripe.EventUtility.ConstructEvent(
                    json,
                    stripeSignature,
                    _webhookSecret
                );
            }
            catch (StripeException ex)
            {
                throw new InvalidOperationException(
                    "Failed to verify Stripe webhook signature.",
                    ex
                );
            }

            switch (stripeEvent.Type)
            {
                case "checkout.session.completed":
                {
                    var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                    if (session == null)
                    {
                        throw new InvalidOperationException(
                            "Invalid checkout session data in webhook event."
                        );
                    }

                    string userId =
                        session.Metadata?["userId"]
                        ?? throw new InvalidOperationException(
                            "UserId not found in checkout session metadata."
                        );

                    var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
                    if (userBilling == null)
                    {
                        throw new KeyNotFoundException(
                            $"User billing information for user ID {userId} not found."
                        );
                    }

                    using var transaction = await _dbContext.Database.BeginTransactionAsync();
                    try
                    {
                        const int tokensToAdd = 50;
                        await _userBillingRepository.AddTokensAsync(userId, tokensToAdd);

                        var tokenTransaction = new TokenTransaction
                        {
                            UserId = userId,
                            ServiceName = "TokenPurchase",
                            Type = TransactionType.Purchase,
                            Amount = tokensToAdd,
                            CreatedAt = DateTime.UtcNow,
                        };
                        await _tokenTransactionRepository.AddTransactionAsync(tokenTransaction);

                        await transaction.CommitAsync();
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        throw new InvalidOperationException(
                            "Failed to process checkout.session.completed event.",
                            ex
                        );
                    }
                    break;
                }

                case "customer.subscription.updated":
                {
                    var subscription = stripeEvent.Data.Object as Stripe.Subscription;
                    if (subscription == null)
                    {
                        throw new InvalidOperationException(
                            "Invalid subscription data in webhook event."
                        );
                    }

                    string userId =
                        subscription.Metadata?["userId"]
                        ?? throw new InvalidOperationException(
                            "UserId not found in subscription metadata."
                        );

                    var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
                    if (userBilling == null)
                    {
                        throw new KeyNotFoundException(
                            $"User billing information for user ID {userId} not found."
                        );
                    }

                    var newStatus = subscription.Status switch
                    {
                        "active" => SubscriptionStatus.Active,
                        "canceled" => SubscriptionStatus.Canceled,
                        "past_due" => SubscriptionStatus.PastDue,
                        _ => throw new InvalidOperationException(
                            $"Unsupported subscription status: {subscription.Status}"
                        ),
                    };

                    userBilling.SubscriptionStatus = newStatus;
                    userBilling.StripeSubscriptionId = subscription.Id;
                    await _userBillingRepository.UpdateAsync(userBilling);
                    break;
                }

                case "customer.subscription.deleted":
                {
                    var subscription = stripeEvent.Data.Object as Stripe.Subscription;
                    if (subscription == null)
                    {
                        throw new InvalidOperationException(
                            "Invalid subscription data in webhook event."
                        );
                    }

                    string userId =
                        subscription.Metadata?["userId"]
                        ?? throw new InvalidOperationException(
                            "UserId not found in subscription metadata."
                        );

                    var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
                    if (userBilling == null)
                    {
                        throw new KeyNotFoundException(
                            $"User billing information for user ID {userId} not found."
                        );
                    }

                    using var transaction = await _dbContext.Database.BeginTransactionAsync();
                    try
                    {
                        userBilling.SubscriptionStatus = SubscriptionStatus.Canceled;
                        userBilling.SubscriptionLevel = SubscriptionLevel.None;
                        userBilling.SubscriptionEndDate = DateTime.UtcNow;
                        await _userBillingRepository.UpdateAsync(userBilling);
                        await transaction.CommitAsync();
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        throw new InvalidOperationException(
                            "Failed to process customer.subscription.deleted event.",
                            ex
                        );
                    }
                    break;
                }

                case "invoice.payment_failed":
                {
                    var invoice = stripeEvent.Data.Object as Stripe.Invoice;
                    if (invoice == null)
                    {
                        throw new InvalidOperationException(
                            "Invalid invoice data in webhook event."
                        );
                    }

                    string customerId =
                        invoice.CustomerId
                        ?? throw new InvalidOperationException(
                            "CustomerId not found in invoice data."
                        );

                    var userBilling = await _dbContext
                        .UserBillings.Where(ub => ub.StripeCustomerId == customerId)
                        .FirstOrDefaultAsync();
                    if (userBilling == null)
                    {
                        throw new KeyNotFoundException(
                            $"User billing information for customer ID {customerId} not found."
                        );
                    }

                    using var transaction = await _dbContext.Database.BeginTransactionAsync();
                    try
                    {
                        userBilling.SubscriptionStatus = SubscriptionStatus.PastDue;
                        await _userBillingRepository.UpdateAsync(userBilling);
                        await transaction.CommitAsync();
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        throw new InvalidOperationException(
                            "Failed to process invoice.payment_failed event.",
                            ex
                        );
                    }
                    break;
                }

                default:
                    // Ignoruj nieobsługiwane zdarzenia
                    break;
            }
        }
    }
}
