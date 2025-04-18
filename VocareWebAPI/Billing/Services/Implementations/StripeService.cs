using Stripe;
using Stripe.Checkout;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Data;

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
        }

        public async Task<string> CreateCustomerAsync(string userId, string email)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
            {
                _logger.LogWarning(
                    "Attempted to create customer with invalid arguments: userId={UserId}, email={Email}",
                    userId,
                    email
                );
                throw new ArgumentException("User ID and email cannot be null or empty.");
            }

            UserBilling userBilling;
            try
            {
                userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
            }
            catch (KeyNotFoundException)
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
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(
                        ex,
                        "Failed to create UserBilling for userId={UserId}.",
                        userId
                    );
                    throw new InvalidOperationException(
                        $"Failed to create UserBilling for user {userId}.",
                        ex
                    );
                }
            }

            if (!string.IsNullOrEmpty(userBilling.StripeCustomerId))
            {
                return userBilling.StripeCustomerId;
            }

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
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(
                        ex,
                        "Failed to save Stripe customer for userId={UserId}.",
                        userId
                    );
                    throw new InvalidOperationException(
                        $"Failed to save Stripe customer for user {userId}.",
                        ex
                    );
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
                throw new InvalidOperationException(
                    $"Failed to create customer in Stripe: {ex.StripeError?.Message}",
                    ex
                );
            }
        }

        public async Task<string> CreateCheckoutSessionForTokenAsync(string userId, string priceId)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(priceId))
            {
                _logger.LogWarning(
                    "Attempted to create checkout session with invalid arguments: userId={UserId}, priceId={PriceId}",
                    userId,
                    priceId
                );
                throw new ArgumentException("User ID and price ID cannot be null or empty.");
            }

            UserBilling userBilling;
            try
            {
                userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
            }
            catch (KeyNotFoundException)
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
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(
                        ex,
                        "Failed to create UserBilling for userId={UserId}.",
                        userId
                    );
                    throw new InvalidOperationException(
                        $"Failed to create UserBilling for user {userId}.",
                        ex
                    );
                }
            }

            if (string.IsNullOrEmpty(userBilling.StripeCustomerId))
            {
                _logger.LogWarning(
                    "Email is required to create a Stripe customer for userId={UserId}.",
                    userId
                );
                throw new InvalidOperationException(
                    "Email is required to create a Stripe customer. Please provide email or configure user email retrieval."
                );
            }

            var successUrl =
                _configuration["Stripe:SuccessUrl"]
                ?? throw new InvalidOperationException("Success URL not configured.");
            var cancelUrl =
                _configuration["Stripe:CancelUrl"]
                ?? throw new InvalidOperationException("Cancel URL not configured.");

            var sessionOptions = new SessionCreateOptions
            {
                Customer = userBilling.StripeCustomerId,
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions { Price = priceId, Quantity = 1 },
                },
                Mode = "payment",
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Metadata = new Dictionary<string, string> { { "userId", userId } },
            };

            try
            {
                var sessionService = new SessionService();
                var session = await sessionService.CreateAsync(sessionOptions);
                _logger.LogInformation(
                    "Created checkout session for userId={UserId} with sessionUrl={SessionUrl}.",
                    userId,
                    session.Url
                );
                return session.Url;
            }
            catch (StripeException ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create checkout session for userId={UserId}: {StripeErrorMessage}.",
                    userId,
                    ex.StripeError?.Message
                );
                throw new InvalidOperationException(
                    $"Failed to create checkout session: {ex.StripeError?.Message}",
                    ex
                );
            }
        }

        public async Task<string> CreateSubsriptionAsync(string userId, string priceId)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(priceId))
            {
                _logger.LogWarning(
                    "Attempted to create subscription with invalid arguments: userId={UserId}, priceId={PriceId}",
                    userId,
                    priceId
                );
                throw new ArgumentException("User ID and price ID cannot be null or empty.");
            }

            UserBilling userBilling;
            try
            {
                userBilling = await _userBillingRepository.GetByUserIdAsync(userId);
            }
            catch (KeyNotFoundException)
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
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(
                        ex,
                        "Failed to create UserBilling for userId={UserId}.",
                        userId
                    );
                    throw new InvalidOperationException(
                        $"Failed to create UserBilling for user {userId}.",
                        ex
                    );
                }
            }

            if (string.IsNullOrEmpty(userBilling.StripeCustomerId))
            {
                _logger.LogWarning(
                    "Email is required to create a Stripe customer for userId={UserId}.",
                    userId
                );
                throw new InvalidOperationException(
                    "Email is required to create a Stripe customer. Please provide email or configure user email retrieval."
                );
            }

            var successUrl =
                _configuration["Stripe:SuccessUrl"]
                ?? throw new InvalidOperationException("Success URL not configured.");
            var cancelUrl =
                _configuration["Stripe:CancelUrl"]
                ?? throw new InvalidOperationException("Cancel URL not configured.");

            var sessionOptions = new SessionCreateOptions
            {
                Customer = userBilling.StripeCustomerId,
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions { Price = priceId, Quantity = 1 },
                },
                Mode = "subscription",
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Metadata = new Dictionary<string, string> { { "userId", userId } },
            };

            try
            {
                var sessionService = new SessionService();
                var session = await sessionService.CreateAsync(sessionOptions);
                _logger.LogInformation(
                    "Created subscription checkout session for userId={UserId} with sessionUrl={SessionUrl}.",
                    userId,
                    session.Url
                );
                return session.Url;
            }
            catch (StripeException ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create subscription checkout session for userId={UserId}: {StripeErrorMessage}.",
                    userId,
                    ex.StripeError?.Message
                );
                throw new InvalidOperationException(
                    $"Failed to create subscription checkout session: {ex.StripeError?.Message}",
                    ex
                );
            }
        }

        public async Task CancelSubscriptionAsync(string subscriptionId)
        {
            if (string.IsNullOrEmpty(subscriptionId))
            {
                _logger.LogWarning("Attempted to cancel subscription with invalid subscriptionId.");
                throw new ArgumentException("Subscription ID cannot be null or empty.");
            }

            try
            {
                var subscriptionService = new SubscriptionService();
                await subscriptionService.CancelAsync(subscriptionId);
                _logger.LogInformation(
                    "Successfully canceled subscription with subscriptionId={SubscriptionId}.",
                    subscriptionId
                );
            }
            catch (StripeException ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to cancel subscription with subscriptionId={SubscriptionId}: {StripeErrorMessage}.",
                    subscriptionId,
                    ex.StripeError?.Message
                );
                throw new InvalidOperationException(
                    $"Failed to cancel subscription: {ex.StripeError?.Message}",
                    ex
                );
            }
        }
    }
}
