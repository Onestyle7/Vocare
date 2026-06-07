using Microsoft.EntityFrameworkCore;
using Resend;
using Stripe;
using Stripe.Checkout;
using VocareWebAPI.Billing.Configuration;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Dtos;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Data;
using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Services.Implementations
{
    public class StripeService : IStripeService
    {
        private readonly IUserBillingRepository _userBillingRepository;
        private readonly IConfiguration _configuration;
        private readonly ILogger<StripeService> _logger;
        private readonly AppDbContext _dbContext;

        public StripeService(
            IUserBillingRepository userBillingRepository,
            IConfiguration configuration,
            ILogger<StripeService> logger,
            AppDbContext dbContext
        )
        {
            _userBillingRepository = userBillingRepository;
            _configuration = configuration;
            _logger = logger;
            _dbContext = dbContext;

            TokenPackagesConfiguration.Initialize(configuration);
            SubscriptionPackagesConfiguration.Initialize(configuration);
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

            try
            {
                var sessionService = new SessionService();
                var session = await sessionService.CreateAsync(sessionOptions);

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

            if (userBilling.SubscriptionStatus == SubscriptionStatus.Active)
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
                // Opcjonalne: trial period
                SubscriptionData = new SessionSubscriptionDataOptions
                {
                    Metadata = new Dictionary<string, string>
                    {
                        { "userId", userId },
                        { "subscriptionLevel", subscriptionPackage.Level.ToString() },
                    },
                },
            };
            try
            {
                var sessionService = new SessionService();
                var session = await sessionService.CreateAsync(sessionOptions);

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

        public async Task<string> CreateCustomerPortalSessionAsync(string userId, string returnUrl)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.");

            var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

            if (string.IsNullOrEmpty(userBilling.StripeCustomerId))
                throw new MissingStripeCustomerException(userId);

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
                var paymentIntentService = new PaymentIntentService();
                var paymentIntentOptions = new Stripe.PaymentIntentListOptions
                {
                    Customer = userBilling.StripeCustomerId,
                    Limit = limit,
                };

                var paymentIntents = await paymentIntentService.ListAsync(paymentIntentOptions);
                foreach (var intent in paymentIntents)
                {
                    if (intent.Status != "succeeded" && intent.Status != "processing")
                        continue;

                    var paymentDto = new PaymentHistoryDto
                    {
                        Type = "token_purchase",
                        Amount = intent.Amount,
                        Currency = intent.Currency,
                        Status = MapPaymentIntentStatus(intent.Status),
                        CreatedAt = intent.Created,
                        Description = intent.Description ?? "Zakup tokenów",
                        TokenAmount = ExtractTokenAmountFromMetadata(intent.Metadata),
                    };
                    paymentHistory.Add(paymentDto);
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
        private string MapPaymentIntentStatus(string stripeStatus)
        {
            return stripeStatus switch
            {
                "succeeded" => "succeeded",
                "processing" => "pending",
                "requires_payment_method" => "failed",
                "requires_confirmation" => "pending",
                "requires_action" => "pending",
                "canceled" => "failed",
                _ => "unknown",
            };
        }

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
