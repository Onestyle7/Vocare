using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Resend;
using Stripe;
using Stripe.Checkout;
using VocareWebAPI.Billing.Configuration;
using VocareWebAPI.Billing.Constants;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Dtos;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Data;
using VocareWebAPI.Shared.Exceptions;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.Billing.Services.Implementations
{
    public class StripeService : IStripeService
    {
        /// <summary>
        /// Statusy Stripe, w których subskrypcja nadal istnieje i może pobierać płatności –
        /// przy każdym z nich nie sprzedajemy drugiej subskrypcji.
        /// </summary>
        private static readonly HashSet<string> LiveSubscriptionStatuses = new()
        {
            "active",
            "trialing",
            "past_due",
            "unpaid",
            "incomplete",
            "paused",
        };

        /// <summary>Stripe wymaga, by sesja Checkout wygasała co najmniej 30 minut po utworzeniu.</summary>
        private static readonly TimeSpan MinCheckoutSessionLifetime = TimeSpan.FromMinutes(31);
        private static readonly TimeSpan MaxCheckoutSessionLifetime = TimeSpan.FromHours(24);

        private readonly IUserBillingRepository _userBillingRepository;
        private readonly IConfiguration _configuration;
        private readonly ILogger<StripeService> _logger;
        private readonly AppDbContext _dbContext;
        private readonly ITokenTransactionRepository _tokenTransactionRepository;
        private readonly TrialConfig _trialConfig;
        private readonly IConsentDiscountService _consentDiscountService;
        private readonly IPriorAccountService _priorAccountService;
        private readonly Stripe.SubscriptionService _stripeSubscriptions;
        private readonly SessionService _checkoutSessions;

        public StripeService(
            IUserBillingRepository userBillingRepository,
            IConfiguration configuration,
            ILogger<StripeService> logger,
            AppDbContext dbContext,
            ITokenTransactionRepository tokenTransactionRepository,
            IOptions<TrialConfig> trialConfig,
            IConsentDiscountService consentDiscountService,
            IPriorAccountService priorAccountService,
            Stripe.SubscriptionService stripeSubscriptions,
            SessionService checkoutSessions
        )
        {
            _stripeSubscriptions = stripeSubscriptions;
            _checkoutSessions = checkoutSessions;
            _userBillingRepository = userBillingRepository;
            _configuration = configuration;
            _logger = logger;
            _dbContext = dbContext;
            _tokenTransactionRepository = tokenTransactionRepository;
            _trialConfig = trialConfig.Value;
            _consentDiscountService = consentDiscountService;
            _priorAccountService = priorAccountService;

            TokenPackagesConfiguration.Initialize(configuration);
            SubscriptionPackagesConfiguration.Initialize(configuration);
        }

        public async Task<int?> GetTrialDaysAsync(string userId)
        {
            if (_trialConfig.TrialPeriodDays <= 0)
                return null;

            var hasEverHadSubscription =
                await _tokenTransactionRepository.HasEverHadSubscriptionAsync(userId);

            if (hasEverHadSubscription)
                return null;

            // Jeden trial na osobę – usunięcie konta i rejestracja na ten sam e-mail go nie odnawia
            var priorAccount = await _priorAccountService.GetPriorAccountAsync(userId);
            return priorAccount?.HadSubscription == true ? null : _trialConfig.TrialPeriodDays;
        }

        private async Task ExpireOpenSubscriptionCheckoutsAsync(string customerId, string userId)
        {
            var openSessions = await _checkoutSessions.ListAsync(
                new SessionListOptions
                {
                    Customer = customerId,
                    Status = "open",
                    Limit = 100,
                }
            );

            foreach (var session in openSessions.Data.Where(s => s.Mode == "subscription"))
            {
                await _checkoutSessions.ExpireAsync(session.Id);
                _logger.LogInformation(
                    "Expired previous open subscription checkout {SessionId} for userId={UserId}",
                    session.Id,
                    userId
                );
            }
        }

        public async Task<string> CreateCustomerAsync(string userId, string email)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
                throw new ArgumentException("User ID and email cannot be null or empty.");

            UserBilling userBilling;
            try
            {
                userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
            }
            catch (UserBillingNotFoundException)
            {
                _logger.LogInformation(
                    "UserBilling not found for userId={UserId}. Creating new record.",
                    userId
                );
                userBilling = new UserBilling
                {
                    UserId = userId,
                    StripeCustomerId = null,
                    TokenBalance = 0,
                    SubscriptionStatus = SubscriptionStatus.None,
                    SubscriptionLevel = SubscriptionLevel.None,
                };
                using var transaction = await _dbContext.Database.BeginTransactionAsync();
                try
                {
                    await _userBillingRepository.CreateAsync(userBilling);
                    await transaction.CommitAsync();
                }
                catch (Exception ex) when (ex is not DomainException)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(
                        ex,
                        "Failed to create UserBilling for userId={UserId}.",
                        userId
                    );
                    throw;
                }
            }

            if (!string.IsNullOrEmpty(userBilling.StripeCustomerId))
                return userBilling.StripeCustomerId;

            var customerOptions = new CustomerCreateOptions
            {
                Email = email,
                Metadata = new Dictionary<string, string> { { "UserId", userId } },
            };
            try
            {
                var customerService = new CustomerService();
                var customer = await customerService.CreateAsync(customerOptions);
                userBilling.StripeCustomerId = customer.Id;
                using var transaction = await _dbContext.Database.BeginTransactionAsync();
                try
                {
                    await _userBillingRepository.UpdateAsync(userBilling);
                    await transaction.CommitAsync();
                    _logger.LogInformation(
                        "Created Stripe customer for userId={UserId} with customerId={CustomerId}.",
                        userId,
                        customer.Id
                    );
                    return customer.Id;
                }
                catch (Exception ex) when (ex is not DomainException)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(
                        ex,
                        "Failed to save Stripe customer for userId={UserId}.",
                        userId
                    );
                    throw;
                }
            }
            catch (StripeException ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create Stripe customer for userId={UserId}: {StripeErrorMessage}.",
                    userId,
                    ex.StripeError?.Message
                );
                throw;
            }
        }

        public async Task<string> CreateCheckoutSessionForTokenAsync(string userId, string priceId)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(priceId))
                throw new ArgumentException("User ID and price ID cannot be null or empty.");

            var tokenPackage = TokenPackagesConfiguration.GetPackageByPriceId(priceId);
            if (tokenPackage == null)
            {
                _logger.LogError(
                    "Unknown priceId={PriceId} for userId={UserId}. Not found in TokenPackagesConfiguration.",
                    priceId,
                    userId
                );
                throw new TokenPackageNotFoundException(priceId);
            }

            _logger.LogInformation(
                "Creating checkout session for userId={UserId}, priceId={PriceId}, tokens={TokenAmount}",
                userId,
                priceId,
                tokenPackage.TokenAmount
            );

            bool isNew = false;
            UserBilling userBilling;

            try
            {
                userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
            }
            catch (UserBillingNotFoundException)
            {
                isNew = true;
                userBilling = new UserBilling
                {
                    UserId = userId,
                    TokenBalance = 0,
                    SubscriptionStatus = SubscriptionStatus.None,
                    SubscriptionLevel = SubscriptionLevel.None,
                };

                _logger.LogInformation(
                    "UserBilling not found for userId={UserId}. Will create a new one.",
                    userId
                );
            }

            if (string.IsNullOrEmpty(userBilling.StripeCustomerId))
            {
                string? email = await _dbContext
                    .Users.Where(u => u.Id == userId)
                    .Select(u => u.Email)
                    .FirstOrDefaultAsync();

                if (string.IsNullOrEmpty(email))
                {
                    _logger.LogWarning(
                        "Email is required to create a Stripe customer for userId={UserId}.",
                        userId
                    );
                    throw new MissingUserEmailException(userId);
                }

                var customerService = new CustomerService();
                var customer = await customerService.CreateAsync(
                    new CustomerCreateOptions
                    {
                        Email = email,
                        Metadata = new Dictionary<string, string> { { "UserId", userId } },
                    }
                );

                userBilling.StripeCustomerId = customer.Id;

                using var trx = await _dbContext.Database.BeginTransactionAsync();
                try
                {
                    if (isNew)
                        await _userBillingRepository.CreateAsync(userBilling);
                    else
                        await _userBillingRepository.UpdateAsync(userBilling);

                    await trx.CommitAsync();
                    _logger.LogInformation(
                        "Stripe customer created (id={CustomerId}) and userBilling saved for userId={UserId}.",
                        customer.Id,
                        userId
                    );
                }
                catch (Exception ex) when (ex is not DomainException)
                {
                    await trx.RollbackAsync();
                    _logger.LogError(ex, "Failed to save userBilling for userId={UserId}.", userId);
                    throw;
                }
            }

            // budowanie sesji Checkout
            var successUrl =
                _configuration["Stripe:SuccessUrl"]
                ?? throw new InvalidOperationException("Success URL not configured.");
            var cancelUrl =
                _configuration["Stripe:CancelUrl"]
                ?? throw new InvalidOperationException("Cancel URL not configured.");

            var consentDiscount = await _consentDiscountService.GetActiveAsync(userId);

            var sessionOptions = new SessionCreateOptions
            {
                Customer = userBilling.StripeCustomerId,
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions { Price = priceId, Quantity = 1 },
                },
                Mode = "payment",
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Metadata = new Dictionary<string, string>
                {
                    { "userId", userId },
                    { "tokenAmount", tokenPackage.TokenAmount.ToString() }, // KLUCZOWA ZMIANA
                    { "packageName", tokenPackage.Name },
                },
            };

            // Rabat za zgodę marketingową – tylko na jednorazowy zakup tokenów, nigdy na
            // subskrypcję. Wykorzystanie oznaczamy w webhooku po opłaceniu sesji.
            if (consentDiscount is not null)
            {
                sessionOptions.Discounts = new List<SessionDiscountOptions>
                {
                    new SessionDiscountOptions { Coupon = consentDiscount.CouponId },
                };
                sessionOptions.Metadata[CheckoutMetadataKeys.ConsentDiscount] = "true";

                // Sesja Checkout żyje domyślnie 24 h – nie może przeżyć ważności rabatu
                var now = DateTime.UtcNow;
                var discountDeadline =
                    consentDiscount.ExpiresAtUtc < now + MaxCheckoutSessionLifetime
                        ? consentDiscount.ExpiresAtUtc
                        : now + MaxCheckoutSessionLifetime;
                sessionOptions.ExpiresAt =
                    discountDeadline > now + MinCheckoutSessionLifetime
                        ? discountDeadline
                        : now + MinCheckoutSessionLifetime;

                _logger.LogInformation(
                    "Applying {PercentOff}% consent discount to token checkout for userId={UserId}",
                    consentDiscount.PercentOff,
                    userId
                );
            }

            try
            {
                var session = await _checkoutSessions.CreateAsync(sessionOptions);

                _logger.LogInformation(
                    "Created checkout session for userId={UserId} with url={SessionUrl}, tokens={TokenAmount}.",
                    userId,
                    session.Url,
                    tokenPackage.TokenAmount
                );

                return session.Url;
            }
            catch (StripeException ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create checkout session for userId={UserId}: {StripeError}.",
                    userId,
                    ex.StripeError?.Message
                );
                throw;
            }
        }

        public async Task<string> CreateCheckoutSessionForSubscriptionAsync(
            string userId,
            string priceId
        )
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(priceId))
                throw new ArgumentException("User ID and price ID cannot be null or empty.");

            var subscriptionPackage = SubscriptionPackagesConfiguration.GetPackageByPriceId(
                priceId
            );
            if (subscriptionPackage == null)
            {
                _logger.LogError(
                    "Unknown subscription priceId={PriceId} for userId={UserId}",
                    priceId,
                    userId
                );
                throw new SubscriptionPackageNotFoundException(priceId);
            }
            if (!subscriptionPackage.IsActive)
            {
                _logger.LogError(
                    "Inactive subscription package priceId={PriceId} for userId={UserId}",
                    priceId,
                    userId
                );
                throw new InactiveSubscriptionPackageException(priceId);
            }
            _logger.LogInformation(
                "Creating subscrription checkout for userId={UserId}, priceId={PriceId}, package={PackageName}",
                userId,
                priceId,
                subscriptionPackage.Name
            );

            bool isNew = false;
            UserBilling userBilling;

            try
            {
                userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
            }
            catch (UserBillingNotFoundException)
            {
                isNew = true;
                userBilling = new UserBilling
                {
                    UserId = userId,
                    TokenBalance = 0,
                    SubscriptionStatus = SubscriptionStatus.None,
                    SubscriptionLevel = SubscriptionLevel.None,
                };

                _logger.LogInformation(
                    "UserBilling not found for userId={UserId}. Will create a new one.",
                    userId
                );
            }

            if (
                userBilling.SubscriptionStatus == SubscriptionStatus.Active
                || userBilling.SubscriptionStatus == SubscriptionStatus.Trialing
            )
                throw new SubscriptionAlreadyActiveException(userId);

            if (string.IsNullOrEmpty(userBilling.StripeCustomerId))
            {
                string? email = await _dbContext
                    .Users.Where(u => u.Id == userId)
                    .Select(u => u.Email)
                    .FirstOrDefaultAsync();

                if (string.IsNullOrEmpty(email))
                    throw new MissingUserEmailException(userId);

                var customerService = new CustomerService();
                var customer = await customerService.CreateAsync(
                    new CustomerCreateOptions
                    {
                        Email = email,
                        Metadata = new Dictionary<string, string> { { "UserId", userId } },
                    }
                );
                userBilling.StripeCustomerId = customer.Id;

                using var trx = await _dbContext.Database.BeginTransactionAsync();
                try
                {
                    if (isNew)
                        await _userBillingRepository.CreateAsync(userBilling);
                    else
                        await _userBillingRepository.UpdateAsync(userBilling);

                    await trx.CommitAsync();
                    _logger.LogInformation(
                        "Stripe customer created (id={CustomerId}) for subscription userId={UserId}.",
                        customer.Id,
                        userId
                    );
                }
                catch (Exception ex) when (ex is not DomainException)
                {
                    await trx.RollbackAsync();
                    _logger.LogError(
                        ex,
                        "Failed to save userBilling for subscription userId={UserId}",
                        userId
                    );
                    throw;
                }
            }

            // Budowanie sesji Checkout dla subskrypcji
            var successUrl =
                _configuration["Stripe:SuccessUrl"]
                ?? throw new InvalidOperationException("Success URL not configured.");
            var cancelUrl =
                _configuration["Stripe:CancelUrl"]
                ?? throw new InvalidOperationException("Cancel URL not configured.");

            // Nasza baza aktualizuje się dopiero po webhooku – źródłem prawdy o istniejących
            // subskrypcjach klienta jest Stripe
            var stripeSubscriptions = await _stripeSubscriptions.ListAsync(
                new SubscriptionListOptions
                {
                    Customer = userBilling.StripeCustomerId,
                    Status = "all",
                    Limit = 100,
                }
            );
            if (stripeSubscriptions.Data.Any(s => LiveSubscriptionStatuses.Contains(s.Status)))
            {
                _logger.LogWarning(
                    "Stripe already has a live subscription for userId={UserId}, blocking second checkout",
                    userId
                );
                throw new SubscriptionAlreadyActiveException(userId);
            }

            // Tylko jedna otwarta sesja subskrypcji na klienta – zapobiega dwóm subskrypcjom
            // (i dwóm trialom) z równolegle otwartych kart
            await ExpireOpenSubscriptionCheckoutsAsync(userBilling.StripeCustomerId!, userId);

            var trialDays =
                stripeSubscriptions.Data.Count > 0 ? null : await GetTrialDaysAsync(userId);

            _logger.LogInformation(
                "Trial decision for userId={UserId}: trialDays={TrialDays}, stripeSubscriptions={Count}",
                userId,
                trialDays,
                stripeSubscriptions.Data.Count
            );

            var sessionOptions = new SessionCreateOptions
            {
                Customer = userBilling.StripeCustomerId,
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions { Price = priceId, Quantity = 1 },
                },
                Mode = "subscription",
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Metadata = new Dictionary<string, string>
                {
                    { "userId", userId },
                    { "subscriptionLevel", subscriptionPackage.Level.ToString() },
                    { "packageName", subscriptionPackage.Name },
                },

                SubscriptionData = new SessionSubscriptionDataOptions
                {
                    TrialPeriodDays = trialDays,
                    Metadata = new Dictionary<string, string>
                    {
                        { "userId", userId },
                        { "subscriptionLevel", subscriptionPackage.Level.ToString() },
                    },
                },
            };
            try
            {
                var session = await _checkoutSessions.CreateAsync(sessionOptions);

                _logger.LogInformation(
                    "Created subscription checkout session for userId={UserId}, with url={SessionUrl}, package={PackageName}.",
                    userId,
                    session.Url,
                    subscriptionPackage.Name
                );
                return session.Url;
            }
            catch (StripeException ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create subscription checkout session for userId={UserId}: {StripeError}",
                    userId,
                    ex.StripeError?.Message
                );
                throw;
            }
        }

        public async Task<string> CreateCustomerPortalSessionAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.");

            var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

            if (string.IsNullOrEmpty(userBilling.StripeCustomerId))
                throw new MissingStripeCustomerException(userId);

            var returnUrl = _configuration["Stripe:ReturnUrl"];
            var options = new Stripe.BillingPortal.SessionCreateOptions
            {
                Customer = userBilling.StripeCustomerId,
                ReturnUrl = returnUrl,
            };

            var service = new Stripe.BillingPortal.SessionService();
            var session = await service.CreateAsync(options);

            _logger.LogInformation("Created customer portal session for userId={UserId}", userId);

            return session.Url;
        }

        public async Task<List<PaymentHistoryDto>> GetPaymentHistoryAsync(
            string userId,
            int limit = 50
        )
        {
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning(
                    "Attempted to get payment history with invalid argument: userId={UserId}",
                    userId
                );
                throw new ArgumentException("User ID cannot be null or empty.");
            }
            if (limit <= 0 || limit > 100)
            {
                _logger.LogWarning(
                    "Attempted to get payment history with invalid limit: {Limit} for userId={UserId}",
                    limit,
                    userId
                );
                throw new ArgumentException("Limit must be between 1 and 100.");
            }

            UserBilling userBilling;

            try
            {
                userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
            }
            catch (UserBillingNotFoundException)
            {
                _logger.LogInformation(
                    "No UserBilling found for userId={UserId}. Returning empty payment history.",
                    userId
                );
                return new List<PaymentHistoryDto>();
            }

            if (string.IsNullOrEmpty(userBilling.StripeCustomerId))
            {
                _logger.LogInformation(
                    "UserBilling for userId={UserId} has no StripeCustomerId. Returning empty payment history.",
                    userId
                );
                return new List<PaymentHistoryDto>();
            }
            var paymentHistory = new List<PaymentHistoryDto>();
            try
            {
                // Zakupy tokenów bierzemy z sesji Checkout (tryb payment), nie z PaymentIntentów –
                // PaymentIntent powstaje też przy opłaceniu faktury subskrypcji i trafiałby do
                // historii drugi raz jako „Zakup tokenów”. Subskrypcje pokazujemy z faktur niżej.
                var sessionService = new SessionService();
                var sessions = await sessionService.ListAsync(
                    new SessionListOptions
                    {
                        Customer = userBilling.StripeCustomerId,
                        Status = "complete",
                        Limit = limit,
                    }
                );
                foreach (var session in sessions)
                {
                    if (session.Mode != "payment")
                        continue;

                    var status = MapCheckoutPaymentStatus(session.PaymentStatus);
                    if (status is null)
                        continue;

                    paymentHistory.Add(
                        new PaymentHistoryDto
                        {
                            Type = "token_purchase",
                            Amount = session.AmountTotal ?? 0,
                            Currency = session.Currency,
                            Status = status,
                            CreatedAt = session.Created,
                            Description =
                                session.Metadata?.GetValueOrDefault("packageName")
                                ?? "Zakup tokenów",
                            TokenAmount = ExtractTokenAmountFromMetadata(session.Metadata),
                        }
                    );
                }
                var invoiceService = new Stripe.InvoiceService();
                var invoiceOptions = new Stripe.InvoiceListOptions
                {
                    Customer = userBilling.StripeCustomerId,
                    Limit = limit,
                };

                _logger.LogInformation(
                    "Fetching invoices for customerId={CustomerId}",
                    userBilling.StripeCustomerId
                );

                var invoices = await invoiceService.ListAsync(invoiceOptions);

                foreach (var invoice in invoices)
                {
                    if (invoice.Status != "paid" && invoice.Status != "open")
                        continue;

                    var invoiceDto = new PaymentHistoryDto
                    {
                        Type = "subscription",
                        Amount = invoice.AmountPaid,
                        Currency = invoice.Currency,
                        Status = MapInvoiceStatus(invoice.Status),
                        CreatedAt = invoice.Created,
                        Description =
                            invoice.Lines?.Data?.FirstOrDefault()?.Description
                            ?? "Płatność subskrypcyjna",
                        TokenAmount = null,
                    };
                    paymentHistory.Add(invoiceDto);
                }
            }
            catch (StripeException ex)
            {
                _logger.LogError(
                    ex,
                    "Stripe error while fetching payment history for userId={UserId}",
                    userId,
                    ex.StripeError?.Message
                );
                throw;
            }

            var sortedHistory = paymentHistory
                .OrderByDescending(p => p.CreatedAt)
                .Take(limit)
                .ToList();

            _logger.LogInformation(
                "Fetched {Count} payment history records for userId={UserId}",
                sortedHistory.Count,
                userId
            );
            return sortedHistory;
        }

        /// <summary>
        /// Mapuje status payment intent ze stripe na nasz uproszczony
        /// </summary>
        /// <param name="stripeStatus">Status ze stripe</param>
        /// <returns>nasz ujednolicony status</returns>
        /// <summary>
        /// Status płatności sesji Checkout w historii albo null, gdy sesja nie wymagała płatności.
        /// „unpaid” przy zakończonej sesji oznacza metodę płatności z opóźnionym rozliczeniem.
        /// </summary>
        private static string? MapCheckoutPaymentStatus(string paymentStatus) =>
            paymentStatus switch
            {
                "paid" => "succeeded",
                "unpaid" => "pending",
                _ => null,
            };

        /// <summary>
        /// Mapuje status invoce ze stripe na nasz uproszczony
        /// </summary>
        /// <param name="stripeStatus">Status ze stripe</param>
        /// <returns>nasz ujednolicony status</returns>
        private string MapInvoiceStatus(string stripeStatus)
        {
            return stripeStatus switch
            {
                "paid" => "succeeded",
                "open" => "pending",
                "void" => "failed",
                "uncollectible" => "failed",
                _ => "unknown",
            };
        }

        private int? ExtractTokenAmountFromMetadata(IDictionary<string, string>? metadata)
        {
            if (metadata == null)
                return null;

            if (!metadata.ContainsKey("tokenAmount"))
                return null;

            string tokenAmountString = metadata["tokenAmount"];

            if (int.TryParse(tokenAmountString, out var amount))
            {
                return amount;
            }

            return null;
        }
    }
}
