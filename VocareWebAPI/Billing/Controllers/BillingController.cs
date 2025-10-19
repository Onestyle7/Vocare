using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;
using Stripe;
using VocareWebAPI.Billing.Models.Dtos;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Interfaces;

namespace VocareWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BillingController : ControllerBase
    {
        private readonly IStripeService _stripeService;
        private readonly IBillingService _billingService;
        private readonly ILogger<BillingController> _logger;
        private readonly IUserBillingRepository _userBillingRepository;

        public BillingController(
            IStripeService stripeService,
            IBillingService billingService,
            ILogger<BillingController> logger,
            IUserBillingRepository userBillingRepository
        )
        {
            _stripeService = stripeService;
            _billingService = billingService;
            _logger = logger;
            _userBillingRepository = userBillingRepository;
        }

        [HttpPost("create-checkout-session")]
        [Authorize]
        public async Task<IActionResult> CreateCheckoutSession(
            [FromBody] CreateCheckoutSessionRequestDto request
        )
        {
            if (request == null || string.IsNullOrEmpty(request.PriceId))
            {
                _logger.LogWarning("Invalid request: {@Request}", request);
                return BadRequest(new { Error = "PriceId is required." });
            }

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Authenticated userId is missing from claims.");
                return Unauthorized(new { Error = "User must be authenticated." });
            }

            try
            {
                var sessionUrl = await _stripeService.CreateCheckoutSessionForTokenAsync(
                    userId,
                    request.PriceId
                );
                _logger.LogInformation(
                    "Created checkout session for userId={UserId}, url={SessionUrl}.",
                    userId,
                    sessionUrl
                );

                return Ok(new { Url = sessionUrl });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create checkout session for userId={UserId}.",
                    userId
                );
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error during create-checkout-session for userId={UserId}.",
                    userId
                );
                return StatusCode(500, new { Error = "An unexpected error occurred." });
            }
        }

#if DEBUG
        [HttpGet("debug/user-billing/{userId}")]
#endif
        [Authorize] // Tylko dla zalogowanych użytkowników
        public async Task<IActionResult> DebugUserBilling(string userId)
        {
            try
            {
                // Sprawdź czy wywołujący użytkownik to admin lub sam użytkownik
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (currentUserId != userId && !User.IsInRole("Admin"))
                {
                    return Forbid("You can only view your own billing information.");
                }

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
            catch (KeyNotFoundException)
            {
                return NotFound(
                    new { message = $"No billing information found for user {userId}" }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting billing info for user {UserId}", userId);
                return StatusCode(500, new { message = "Error retrieving billing information" });
            }
        }

        [HttpPost("webhook")]
        [AllowAnonymous]
        [EnableRateLimiting("WebhookPolicy")]
        public async Task<IActionResult> Webhook()
        {
            var json = await new StreamReader(Request.Body).ReadToEndAsync();
            var stripeSignature = Request.Headers["Stripe-Signature"];

            if (string.IsNullOrEmpty(json) || string.IsNullOrEmpty(stripeSignature))
            {
                _logger.LogWarning("Invalid webhook request: missing JSON or Stripe-Signature.");
                return BadRequest(new { Error = "Invalid webhook request." });
            }

            await _billingService.HandleWebhookAsync(json, stripeSignature!);
            _logger.LogInformation("Successfully processed webhook.");

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
            try
            {
                string userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest("Brak identyfikatora użytkownika w tokenie.");
                }

                var userBilling = await _billingService.GetUserBillingAsync(userId);
                if (userBilling == null)
                {
                    return NotFound("Nie znaleziono informacji o płatności dla tego użytkownika.");
                }

                return Ok(
                    new
                    {
                        tokenBalance = userBilling.TokenBalance,
                        subscriptionStatus = userBilling.SubscriptionStatus.ToString(),
                    }
                );
            }
            catch (KeyNotFoundException)
            {
                // Specyficzny catch dla KeyNotFoundException - zwraca 404
                return NotFound("Nie znaleziono informacji o płatności dla tego użytkownika.");
            }
            catch (Exception ex)
            {
                // Ogólny catch dla innych błędów - zwraca 500
                _logger.LogError(ex, "Błąd podczas pobierania salda tokenów.");
                return StatusCode(500, "Wystąpił błąd podczas przetwarzania żądania.");
            }
        }

        [HttpPost("create-subscription-checkout")]
        [Authorize]
        public async Task<IActionResult> CreateSubscriptionCheckout(
            [FromBody] CreateCheckoutSessionRequestDto request
        )
        {
            if (request == null || string.IsNullOrEmpty(request.PriceId))
            {
                return BadRequest(new { Error = "PriceId is required." });
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { Error = "User must be authenticated." });
            }

            try
            {
                var sessionUrl = await _stripeService.CreateCheckoutSessionForSubscriptionAsync(
                    userId,
                    request.PriceId
                );
                return Ok(new { Url = sessionUrl });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error creating subscription checkout for userId={UserId}",
                    userId
                );
                return StatusCode(500, new { Error = "An unexpected error occurred." });
            }
        }

        [HttpGet("subscription-status")]
        [Authorize]
        public async Task<IActionResult> GetSubscriptionStatus()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Error = "User must be authenticated." });
                }

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
            catch (KeyNotFoundException)
            {
                return NotFound(new { Error = "User billing information not found." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting subscription status");
                return StatusCode(500, new { Error = "An unexpected error occurred." });
            }
        }

        [HttpPost("customer-portal")]
        [Authorize]
        public async Task<IActionResult> CreateCustomerPortalSession()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { Error = "User must be authenticated." });

            try
            {
                // URL powrotu do aplikacji
                var returnUrl = $"{Request.Scheme}://{Request.Host}/dashboard";

                var portalUrl = await _stripeService.CreateCustomerPortalSessionAsync(
                    userId,
                    returnUrl
                );

                return Ok(new { Url = portalUrl });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Error = "User billing information not found." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating customer portal for userId={UserId}", userId);
                return StatusCode(500, new { Error = "An unexpected error occurred." });
            }
        }

        [HttpPost("cancel-subscription")]
        [Authorize]
        public async Task<IActionResult> CancelSubscription()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning(
                        "Unauthenticated user attempted to access cancel subscription."
                    );
                    return Unauthorized(new { Error = "User must be authenticated." });
                }

                var userBilling = await _billingService.GetUserBillingAsync(userId);

                if (string.IsNullOrEmpty(userBilling.StripeSubscriptionId))
                {
                    _logger.LogWarning(
                        "User {UserId} has no active subscription to cancel.",
                        userId
                    );
                    return BadRequest(new { Error = "No active subscription to cancel." });
                }

                if (userBilling.SubscriptionStatus == SubscriptionStatus.Canceled)
                {
                    _logger.LogWarning(
                        "User {UserId} attempted to cancel already canceled subscription",
                        userId
                    );
                    return BadRequest(
                        new
                        {
                            Error = "Subscription is already canceled.",
                            SubscriptionEndDate = userBilling.SubscriptionEndDate,
                        }
                    );
                }

                var returnUrl = $"{Request.Scheme}://{Request.Host}/dashboard";

                _logger.LogInformation(
                    "Creating Customer Portal sesstion for userId={UserId} to cancel subscription.",
                    userId
                );
                var portalUrl = await _stripeService.CreateCustomerPortalSessionAsync(
                    userId,
                    returnUrl
                );

                _logger.LogInformation(
                    "Customer Portal URL created for userId={UserId}.",
                    userId,
                    portalUrl
                );

                return Ok(
                    new
                    {
                        Url = portalUrl,
                        Message = "Redirecting to customer portal where you can manage your subscription.",
                    }
                );
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning(
                    "User billing information not found during cancel subscription attempt."
                );
                return NotFound(new { Error = "User billing information not found." });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "User has no Stripe customer record.");
                return BadRequest(new { Error = "User has no Stripe customer record." });
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Stripe error during cancel subscription process.");
                return StatusCode(500, new { Error = "Error communicating with payment gateway." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during cancel subscription process.");
                return StatusCode(500, new { Error = "An unexpected error occurred." });
            }
        }
    }
}
