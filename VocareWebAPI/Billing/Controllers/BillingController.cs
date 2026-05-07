using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Stripe;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Dtos;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Interfaces;

//test comment
namespace VocareWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BillingController : ControllerBase
    {
        private readonly IStripeService _stripeService;
        private readonly IBillingService _billingService;
        private readonly ILogger<BillingController> _logger;

        public BillingController(
            IStripeService stripeService,
            IBillingService billingService,
            ILogger<BillingController> logger
        )
        {
            _stripeService = stripeService;
            _billingService = billingService;
            _logger = logger;
        }

        [HttpPost("create-checkout-session")]
        [Authorize]
        public async Task<IActionResult> CreateCheckoutSession(
            [FromBody] CreateCheckoutSessionRequestDto request
        )
        {
            if (request == null || string.IsNullOrEmpty(request.PriceId))
                return BadRequest(new { Error = "PriceId is required." });

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var sessionUrl = await _stripeService.CreateCheckoutSessionForTokenAsync(
                userId,
                request.PriceId
            );

            return Ok(new { Url = sessionUrl });
        }

#if DEBUG
        [HttpGet("debug/user-billing/{userId}")]
#endif
        [Authorize]
        public async Task<IActionResult> DebugUserBilling(string userId)
        {
            // Sprawdź czy wywołujący użytkownik to admin lub sam użytkownik
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId != userId && !User.IsInRole("Admin"))
                return Forbid("You can only view your own billing information.");

            var userBilling = await _billingService.GetUserBillingAsync(userId);

            return Ok(
                new
                {
                    userId = userBilling.UserId,
                    tokenBalance = userBilling.TokenBalance,
                    stripeCustomerId = userBilling.StripeCustomerId,
                    subscriptionStatus = userBilling.SubscriptionStatus.ToString(),
                    subscriptionLevel = userBilling.SubscriptionLevel.ToString(),
                    lastTokenPurchaseDate = userBilling.LastTokenPurchaseDate,
                    subscriptionEndDate = userBilling.SubscriptionEndDate,
                }
            );
        }

        [HttpPost("webhook")]
        [AllowAnonymous]
        [EnableRateLimiting("WebhookPolicy")]
        public async Task<IActionResult> Webhook()
        {
            var json = await new StreamReader(Request.Body).ReadToEndAsync();
            var stripeSignature = Request.Headers["Stripe-Signature"];

            if (string.IsNullOrEmpty(json) || string.IsNullOrEmpty(stripeSignature))
                return BadRequest(new { Error = "Invalid webhook request." });

            await _billingService.HandleWebhookAsync(json, stripeSignature!);

            return Ok();
        }

        [HttpGet("success")]
        [AllowAnonymous]
        public IActionResult Success()
        {
            return Ok(new { Message = "Payment successful. Thank you!" });
        }

        [HttpGet("cancel")]
        [AllowAnonymous]
        public IActionResult Cancel()
        {
            return Ok(new { Message = "Payment canceled." });
        }

        [HttpGet("access-status")]
        [Authorize]
        public async Task<IActionResult> GetAccessStatus()
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var userBilling = await _billingService.GetUserBillingAsync(userId);

            return Ok(
                new
                {
                    tokenBalance = userBilling.TokenBalance,
                    subscriptionStatus = userBilling.SubscriptionStatus.ToString(),
                }
            );
        }

        [HttpPost("create-subscription-checkout")]
        [Authorize]
        public async Task<IActionResult> CreateSubscriptionCheckout(
            [FromBody] CreateCheckoutSessionRequestDto request
        )
        {
            if (request == null || string.IsNullOrEmpty(request.PriceId))
                return BadRequest(new { Error = "PriceId is required." });

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var sessionUrl = await _stripeService.CreateCheckoutSessionForSubscriptionAsync(
                userId,
                request.PriceId
            );

            return Ok(new { Url = sessionUrl });
        }

        [HttpGet("subscription-status")]
        [Authorize]
        public async Task<IActionResult> GetSubscriptionStatus()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var userBilling = await _billingService.GetUserBillingAsync(userId);

            return Ok(
                new
                {
                    subscriptionStatus = userBilling.SubscriptionStatus.ToString(),
                    subscriptionLevel = userBilling.SubscriptionLevel.ToString(),
                    subscriptionEndDate = userBilling.SubscriptionEndDate,
                    subscriptionId = userBilling.StripeSubscriptionId,
                }
            );
        }

        [HttpPost("customer-portal")]
        [Authorize]
        public async Task<IActionResult> CreateCustomerPortalSession()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            // URL powrotu do aplikacji
            var returnUrl = $"{Request.Scheme}://{Request.Host}/dashboard";

            var portalUrl = await _stripeService.CreateCustomerPortalSessionAsync(
                userId,
                returnUrl
            );

            return Ok(new { Url = portalUrl });
        }

        [HttpPost("cancel-subscription")]
        [Authorize]
        public async Task<IActionResult> CancelSubscription()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var userBilling = await _billingService.GetUserBillingAsync(userId);

            // Wydaje mi się, że ta część powinna zostać przeniesiona do serwisy, ale zostawiam ją tutaj, żeby nic nie wysypać na płatnościach
            if (string.IsNullOrEmpty(userBilling.StripeSubscriptionId))
            {
                _logger.LogWarning("User {UserId} has no active subscription to cancel.", userId);
                throw new NoActiveSubscriptionException(userId);
            }

            if (userBilling.SubscriptionStatus == SubscriptionStatus.Canceled)
            {
                _logger.LogWarning(
                    "User {UserId} attempted to cancel already canceled subscription",
                    userId
                );
                throw new SubscriptionAlreadyCanceledException(
                    userId,
                    userBilling.SubscriptionEndDate
                );
            }

            var returnUrl = $"{Request.Scheme}://{Request.Host}/dashboard";

            _logger.LogInformation(
                "Creating Customer Portal session for userId={UserId} to cancel subscription.",
                userId
            );
            var portalUrl = await _stripeService.CreateCustomerPortalSessionAsync(
                userId,
                returnUrl
            );

            return Ok(
                new
                {
                    Url = portalUrl,
                    Message = "Redirecting to customer portal where you can manage your subscription.",
                }
            );
        }

        [HttpGet("payment-history")]
        [Authorize]
        public async Task<IActionResult> GetPaymentHistory([FromQuery] int limit = 50)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            if (limit <= 0 || limit > 100)
                return BadRequest(new { Error = "Limit must be between 1 and 100." });

            _logger.LogInformation(
                "Fetching payment history for userId={UserId} with limit={Limit}.",
                userId,
                limit
            );

            var paymentHistory = await _stripeService.GetPaymentHistoryAsync(userId, limit);

            _logger.LogInformation(
                "Successfully returned {Count} payment history items for userId={UserId}.",
                paymentHistory.Count,
                userId
            );

            return Ok(new { payments = paymentHistory, count = paymentHistory.Count });
        }
    }
}
