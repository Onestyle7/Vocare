using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Stripe;
using VocareWebAPI.Billing.Models.Dtos;
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

        [HttpPost("create-subscription")]
        [Authorize]
        public async Task<IActionResult> CreateSubscription(
            [FromBody] CreateSubscriptionRequestDto request
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
                var sessionUrl = await _stripeService.CreateSubsriptionAsync(
                    userId,
                    request.PriceId
                );
                _logger.LogInformation(
                    "Created subscription session for userId={UserId}, url={SessionUrl}.",
                    userId,
                    sessionUrl
                );

                return Ok(new { Url = sessionUrl });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Failed to create subscription for userId={UserId}.", userId);
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error during create-subscription for userId={UserId}.",
                    userId
                );
                return StatusCode(500, new { Error = "An unexpected error occurred." });
            }
        }

        [HttpPost("cancel-subscription")]
        [Authorize]
        public async Task<IActionResult> CancelSubscription(
            [FromBody] CancelSubscriptionRequestDto request
        )
        {
            if (request == null || string.IsNullOrEmpty(request.SubscriptionId))
            {
                _logger.LogWarning("Invalid request: {@Request}", request);
                return BadRequest(new { Error = "SubscriptionId is required." });
            }

            try
            {
                await _stripeService.CancelSubscriptionAsync(request.SubscriptionId);
                _logger.LogInformation(
                    "Canceled subscription {SubscriptionId}.",
                    request.SubscriptionId
                );

                return Ok(new { Message = "Subscription canceled successfully." });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to cancel subscription {SubscriptionId}.",
                    request.SubscriptionId
                );
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error during cancel-subscription {SubscriptionId}.",
                    request.SubscriptionId
                );
                return StatusCode(500, new { Error = "An unexpected error occurred." });
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

            await _billingService.HandleWebhookAsync(json, stripeSignature);
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
    }
}
