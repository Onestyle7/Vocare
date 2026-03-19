using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;
using VocareWebAPI.Billing.Configuration;
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
        private readonly ILogger<BillingService> _logger;

        public BillingService(
            AppDbContext context,
            IServiceCostRepository serviceCostRepository,
            IUserBillingRepository userBillingRepository,
            ITokenTransactionRepository tokenTransactionRepository,
            IConfiguration configuration,
            ILogger<BillingService> logger
        )
        {
            _dbContext = context;
            _serviceCostRepository = serviceCostRepository;
            _userBillingRepository = userBillingRepository;
            _tokenTransactionRepository = tokenTransactionRepository;
            _logger = logger;
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
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(serviceName))
                throw new ArgumentException("User ID and service name cannot be null or empty.");

            var serviceCost = await _serviceCostRepository.GetServiceCostAsync(serviceName);
            if (serviceCost <= 0)
                throw new InvalidOperationException(
                    $"Service cost for {serviceName} is not valid."
                );

            var userBilling = await _dbContext.UserBillings.FirstOrDefaultAsync(ub =>
                ub.UserId == userId
            );
            if (userBilling is null)
                throw new KeyNotFoundException(
                    $"User billing information for user ID {userId} not found."
                );

            if (userBilling.SubscriptionStatus == SubscriptionStatus.Active)
                return;

            if (userBilling.TokenBalance < serviceCost)
                throw new InvalidOperationException(
                    $"User {userId} does not have enough tokens to access {serviceName}."
                );

            var isInMemory =
                _dbContext.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory";

            if (isInMemory)
            {
                await ProcessTokenDeductionAsync(userBilling, userId, serviceName, serviceCost);
            }
            else
            {
                await using var trx = await _dbContext.Database.BeginTransactionAsync();
                try
                {
                    await ProcessTokenDeductionAsync(userBilling, userId, serviceName, serviceCost);
                    await trx.CommitAsync();
                }
                catch (Exception ex)
                {
                    await trx.RollbackAsync();
                    throw new InvalidOperationException("Failed to deduct tokens for service.", ex);
                }
            }
        }

        private async Task ProcessTokenDeductionAsync(
            UserBilling userBilling,
            string userId,
            string serviceName,
            int serviceCost
        )
        {
            userBilling.TokenBalance -= serviceCost;
            userBilling.LastTokenPurchaseDate = DateTime.UtcNow;

            var tokenTransaction = new TokenTransaction
            {
                UserId = userId,
                ServiceName = serviceName,
                Type = TransactionType.Usage,
                Amount = -serviceCost,
                CreatedAt = DateTime.UtcNow,
            };
            await _dbContext.TokenTransactions.AddAsync(tokenTransaction);

            await _dbContext.SaveChangesAsync();
        }

        public async Task HandleWebhookAsync(string json, string stripeSignature)
        {
            _logger.LogInformation($"=== WEBHOOK RECEIVED ===");
            _logger.LogInformation($"Signature: {stripeSignature?.Substring(0, 20)}...");

            if (string.IsNullOrEmpty(json) || string.IsNullOrEmpty(stripeSignature))
                throw new ArgumentException("Invalid webhook payload or missing signature.");

            var stripeEvent = Stripe.EventUtility.ConstructEvent(
                json,
                stripeSignature,
                _webhookSecret,
                throwOnApiVersionMismatch: false
            );
            _logger.LogInformation($"Event type: {stripeEvent.Type}");
            _logger.LogInformation($"Event ID: {stripeEvent.Id}");

            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                if (session?.Mode == "payment")
                {
                    // ---------- Pobieranie danych z metadanych ----------
                    var userId =
                        session.Metadata?["userId"]
                        ?? throw new InvalidOperationException("userId missing in metadata");

                    if (!session.Metadata.TryGetValue("tokenAmount", out var tokenAmountStr))
                    {
                        _logger.LogError(
                            "tokenAmount missing in metadata for session {SessionId}, userId {UserId}",
                            session.Id,
                            userId
                        );
                        throw new InvalidOperationException("tokenAmount missing in metadata");
                    }

                    if (!int.TryParse(tokenAmountStr, out var tokensToAdd))
                    {
                        _logger.LogError(
                            "Invalid tokenAmount value '{TokenAmountStr}' for session {SessionId}, userId {UserId}",
                            tokenAmountStr,
                            session.Id,
                            userId
                        );
                        throw new InvalidOperationException(
                            $"Invalid tokenAmount value: {tokenAmountStr}"
                        );
                    }

                    var packageName = session.Metadata?.GetValueOrDefault(
                        "packageName",
                        "Unknown Package"
                    );

                    _logger.LogInformation(
                        "Processing payment for userId={UserId}, package={PackageName}, tokens={TokenAmount}",
                        userId,
                        packageName,
                        tokensToAdd
                    );

                    var ub = await _userBillingRepository.GetByUserIdAsync(userId);
                    if (ub == null)
                        throw new KeyNotFoundException($"No billing for {userId}");

                    await using var tx = await _dbContext.Database.BeginTransactionAsync();
                    try
                    {
                        await _userBillingRepository.AddTokensAsync(userId, tokensToAdd);

                        var tt = new TokenTransaction
                        {
                            UserId = userId,
                            ServiceName = $"TokenPurchase-{packageName}",
                            Type = TransactionType.Purchase,
                            Amount = tokensToAdd,
                            CreatedAt = DateTime.UtcNow,
                        };
                        await _tokenTransactionRepository.AddTransactionAsync(tt);

                        await tx.CommitAsync();

                        _logger.LogInformation(
                            "Successfully added {TokenAmount} tokens to userId={UserId} for package={PackageName}",
                            tokensToAdd,
                            userId,
                            packageName
                        );
                    }
                    catch (Exception ex)
                    {
                        await tx.RollbackAsync();
                        _logger.LogError(
                            ex,
                            "Failed to process token purchase for userId={UserId}, session={SessionId}",
                            userId,
                            session.Id
                        );
                        throw;
                    }
                }
            }
            else if (stripeEvent.Type == "customer.subscription.created")
            {
                await HandleSubscriptionCreatedAsync(stripeEvent);
            }
            else if (stripeEvent.Type == "customer.subscription.updated")
            {
                await HandleSubscriptionUpdatedAsync(stripeEvent);
            }
            else if (stripeEvent.Type == "customer.subscription.deleted")
            {
                await HandleSubscriptionDeletedAsync(stripeEvent);
            }
            else if (stripeEvent.Type == "invoice.payment_succeeded")
            {
                await HandleInvoicePaymentSucceededAsync(stripeEvent);
            }
            else if (stripeEvent.Type == "invoice.payment_failed")
            {
                await HandleInvoicePaymentFailedAsync(stripeEvent);
            }
            else
            {
                _logger.LogInformation($"Unhandled webhook event type: {stripeEvent.Type}");
            }
        }

        public async Task<UserBilling> GetUserBillingAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));
            }
            var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
            _logger.LogInformation($"GetUserBillingAsync for userId: {userId}");
            _logger.LogInformation($"Found billing: {userBilling != null}");
            if (userBilling == null)
            {
                throw new KeyNotFoundException(
                    $"User billing information for user ID {userId} not found."
                );
            }
            return userBilling;
        }

        /// <summary>
        /// Obsługuje utworzenie nowej subskrypcji w Stripe
        /// Aktualizuje status subskrypcji użytkownika w bazie danych na Active
        /// </summary>
        /// <param name="stripeEvent"></param>
        /// <returns></returns>
        private async Task HandleSubscriptionCreatedAsync(Stripe.Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Stripe.Subscription;
            if (subscription == null)
            {
                _logger.LogError(
                    "Invalid subscription object in webhook {EventId}",
                    stripeEvent.Id
                );
                return;
            }

            _logger.LogInformation(
                "Processing subscription.created for subscriptionId={SubscriptionId}, customerId={CustomerId}",
                subscription.Id,
                subscription.CustomerId
            );

            var userId = await _userBillingRepository.GetUserIdByCustomerIdAsync(
                subscription.CustomerId
            );
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogError(
                    "No userId found for customerId={CustomerId}",
                    subscription.CustomerId
                );
                return;
            }

            var subscriptionLevel = DetermineSubscriptionLevel(subscription);

            DateTime? subscriptionEndDate = null;
            if (subscription.Items?.Data?.Any() == true)
            {
                subscriptionEndDate = subscription.Items.Data.First().CurrentPeriodEnd;
            }

            await using var tx = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

                userBilling.StripeSubscriptionId = subscription.Id;
                userBilling.SubscriptionStatus = SubscriptionStatus.Active;
                userBilling.SubscriptionLevel = subscriptionLevel;
                userBilling.SubscriptionEndDate = subscriptionEndDate;

                await _userBillingRepository.UpdateAsync(userBilling);

                var transaction = new TokenTransaction
                {
                    UserId = userId,
                    ServiceName = $"SubscriptionActivated-{subscriptionLevel}",
                    Type = TransactionType.Purchase,
                    Amount = 0,
                    CreatedAt = DateTime.UtcNow,
                };
                await _tokenTransactionRepository.AddTransactionAsync(transaction);

                await tx.CommitAsync();

                _logger.LogInformation(
                    "Successfully activated subscription for userId={UserId}, level={SubscriptionLevel}, endDate={EndDate}",
                    userId,
                    subscriptionLevel,
                    subscriptionEndDate
                );
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                _logger.LogError(
                    ex,
                    "Failed to process subscription.created for userId={UserId}, subscriptionId={SubscriptionId}",
                    userId,
                    subscription.Id
                );
                throw;
            }
        }

        /// <summary>
        /// Obsługuje aktualizację subskrypcji (odnowienie, zmiana statusu, etc.)
        /// </summary>
        /// <param name="stripeEvent"></param>
        /// <returns></returns>
        private async Task HandleSubscriptionUpdatedAsync(Stripe.Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Stripe.Subscription;
            if (subscription == null)
            {
                _logger.LogError(
                    "Invalid subscription object in webhook {EventId}",
                    stripeEvent.Id
                );
                return;
            }

            _logger.LogInformation(
                "Processing subscription.updated for subscriptionId={SubscriptionId}, status={Status}",
                subscription.Id,
                subscription.Status
            );

            var userId = await _userBillingRepository.GetUserIdByCustomerIdAsync(
                subscription.CustomerId
            );
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogError(
                    "No userId found for customerId={CustomerId}",
                    subscription.CustomerId
                );
                return;
            }

            try
            {
                var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

                userBilling.SubscriptionStatus = MapStripeStatusToOurStatus(subscription.Status);

                if (subscription.Items?.Data?.Any() == true)
                {
                    userBilling.SubscriptionEndDate = subscription
                        .Items.Data.First()
                        .CurrentPeriodEnd;
                }

                if (
                    subscription.CancelAtPeriodEnd == true
                    && userBilling.SubscriptionStatus == SubscriptionStatus.Active
                )
                {
                    _logger.LogInformation(
                        "Subscription {SubscriptionId} for userId={UserId} will be canceled at period end: {EndDate}",
                        subscription.Id,
                        userId,
                        userBilling.SubscriptionEndDate
                    );
                }

                await _userBillingRepository.UpdateAsync(userBilling);

                _logger.LogInformation(
                    "Successfully updated subscription for userId={UserId}, newStatus={NewStatus}",
                    userId,
                    userBilling.SubscriptionStatus
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to process subscription.updated for userId={UserId}, subscriptionId={SubscriptionId}",
                    userId,
                    subscription.Id
                );
                throw;
            }
        }

        /// <summary>
        /// Obsługuje usunięcie/anulowanie subskrypcji w Stripe
        /// </summary>
        /// <param name="stripeEvent"></param>
        /// <returns></returns>
        private async Task HandleSubscriptionDeletedAsync(Stripe.Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Stripe.Subscription;
            if (subscription == null)
                return;

            _logger.LogInformation(
                "Processing subscription.deleted for subscriptionId={SubscriptionId}",
                subscription.Id
            );

            var userId = await _userBillingRepository.GetUserIdByCustomerIdAsync(
                subscription.CustomerId
            );
            if (string.IsNullOrEmpty(userId))
                return;

            try
            {
                var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

                userBilling.SubscriptionStatus = SubscriptionStatus.Canceled;
                userBilling.SubscriptionLevel = SubscriptionLevel.None;
                userBilling.SubscriptionEndDate = DateTime.UtcNow;

                await _userBillingRepository.UpdateAsync(userBilling);

                _logger.LogInformation(
                    "Successfully canceled subscription for userId={UserId}",
                    userId
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to process subscription.deleted for userId={UserId}",
                    userId
                );
                throw;
            }
        }

        /// <summary>
        /// Obsługuje nieudaną płatność faktury
        /// </summary>
        private async Task HandleInvoicePaymentSucceededAsync(Stripe.Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Stripe.Invoice;
            if (invoice == null)
            {
                _logger.LogError("Invalid invoice object in webhook {EventId}", stripeEvent.Id);
                return;
            }

            var customerId = invoice.CustomerId;
            if (string.IsNullOrEmpty(customerId))
            {
                _logger.LogWarning("Invoice {InvoiceId} has no customerId. Skipping.", invoice.Id);
                return;
            }

            _logger.LogInformation(
                "Processing invoice.payment_succeeded for customerId={CustomerId}",
                customerId
            );

            try
            {
                var userId = await _userBillingRepository.GetUserIdByCustomerIdAsync(customerId);
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogError("No userId found for customerId={CustomerId}", customerId);
                    return;
                }

                var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

                userBilling.SubscriptionStatus = SubscriptionStatus.Active;

                DateTime? periodEnd = null;
                if (invoice.Lines?.Data?.Any() == true)
                {
                    var line = invoice.Lines.Data.FirstOrDefault();
                    periodEnd = line?.Period?.End;
                }

                if (periodEnd.HasValue)
                {
                    userBilling.SubscriptionEndDate = periodEnd;
                }

                await _userBillingRepository.UpdateAsync(userBilling);

                _logger.LogInformation(
                    "Successfully processed invoice.payment_succeeded for userId={UserId}, newEndDate={EndDate}",
                    userId,
                    userBilling.SubscriptionEndDate
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to process invoice.payment_succeeded for customerId={CustomerId}",
                    customerId
                );
                throw;
            }
        }

        /// <summary>
        /// Mapuje status subskrypcji ze Stripe na nasze SubscriptionStatus enum
        /// </summary>
        private SubscriptionStatus MapStripeStatusToOurStatus(string stripeStatus)
        {
            return stripeStatus switch
            {
                "active" => SubscriptionStatus.Active,
                "trialing" => SubscriptionStatus.Trialing,
                "canceled" => SubscriptionStatus.Canceled,
                "past_due" => SubscriptionStatus.PastDue,
                "unpaid" => SubscriptionStatus.PastDue,
                "incomplete" => SubscriptionStatus.None,
                "incomplete_expired" => SubscriptionStatus.Canceled,
                _ => SubscriptionStatus.None,
            };
        }

        /// <summary>
        /// Określa poziom subskrypcji na podstawie danych ze Stripe
        /// </summary>
        private SubscriptionLevel DetermineSubscriptionLevel(Stripe.Subscription subscription)
        {
            if (subscription.Metadata?.TryGetValue("subscriptionLevel", out var levelStr) == true)
            {
                if (Enum.TryParse<SubscriptionLevel>(levelStr, out var level))
                    return level;
            }

            if (subscription.Items?.Data?.Any() == true)
            {
                var priceId = subscription.Items.Data.First().Price.Id;
                var package = SubscriptionPackagesConfiguration.GetPackageByPriceId(priceId);
                if (package != null)
                    return package.Level;
            }

            return SubscriptionLevel.Monthly;
        }

        private async Task HandleInvoicePaymentFailedAsync(Stripe.Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Stripe.Invoice;
            if (invoice == null)
            {
                _logger.LogError("Invalid invoice object in webhook {EventId}", stripeEvent.Id);
                return;
            }

            var customerId = invoice.CustomerId;

            if (string.IsNullOrEmpty(customerId))
            {
                _logger.LogWarning(
                    "No customer found in failed invoice for webhook {EventId}",
                    stripeEvent.Id
                );
                return;
            }

            _logger.LogWarning(
                "Processing invoice.payment_failed for customerId={CustomerId}",
                customerId
            );

            try
            {
                var userId = await _userBillingRepository.GetUserIdByCustomerIdAsync(customerId);
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogError("No userId found for customerId={CustomerId}", customerId);
                    return;
                }

                var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

                userBilling.SubscriptionStatus = SubscriptionStatus.PastDue;

                await _userBillingRepository.UpdateAsync(userBilling);

                _logger.LogWarning(
                    "Marked subscription as past due for userId={UserId}, customerId={CustomerId}",
                    userId,
                    customerId
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to process invoice.payment_failed for customerId={CustomerId}",
                    customerId
                );
                throw;
            }
        }
    }
}
