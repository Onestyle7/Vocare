using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Stripe;
using VocareWebAPI.Billing.Models.Dtos;
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

        [HttpGet("debug/user-billing/{userId}")]
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

        [HttpGet("get-token-balance")]
        [Authorize]
        public async Task<IActionResult> GetTokenBalance()
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

                return Ok(new { tokenBalance = userBilling.TokenBalance });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd podczas pobierania salda tokenów.");
                return StatusCode(500, "Wystąpił błąd podczas przetwarzania żądania.");
            }
        }
    }
}
