using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VocareWebAPI.Legal.Models.Dtos;
using VocareWebAPI.Legal.Models.Enums;
using VocareWebAPI.Legal.Services.Interfaces;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Shared.Filters;
using VocareWebAPI.Shared.Services.Interfaces;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.Legal.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LegalController : ControllerBase
    {
        private readonly ILegalService _legalService;
        private readonly UserManager<User> _userManager;
        private readonly ITokenService _tokenService;
        private readonly IClientInfoProvider _clientInfoProvider;
        private readonly ILogger<LegalController> _logger;

        public LegalController(
            ILegalService legalService,
            UserManager<User> userManager,
            ITokenService tokenService,
            IClientInfoProvider clientInfoProvider,
            ILogger<LegalController> logger
        )
        {
            _legalService = legalService;
            _userManager = userManager;
            _tokenService = tokenService;
            _clientInfoProvider = clientInfoProvider;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves the list of legal documents that the current user has not accepted yet.
        /// </summary>
        [HttpGet("pending")]
        [Authorize]
        [ProducesResponseType(typeof(List<PendingDocumentDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetPendingDocuments()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token claims.");
            }

            var pendingDocuments = await _legalService.GetPendingDocumentsAsync(userId);
            return Ok(pendingDocuments);
        }

        /// <summary>
        /// Accepts specified legal documents for the current user and reissues an updated access token.
        /// </summary>
        [HttpPost("accept")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        public async Task<IActionResult> AcceptConsents([FromBody] AcceptConsentsRequestDto request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token claims.");
            }

            var clientInfo = _clientInfoProvider.GetClientInfo();

            await _legalService.AcceptConsentsAsync(
                userId,
                request?.DocumentIds ?? [],
                clientInfo.IpAddress,
                clientInfo.UserAgent,
                ConsentSource.ConsentModal
            );

            _logger.LogInformation(
                "User {UserId} accepted legal documents: {DocumentIds}",
                userId,
                string.Join(", ", request?.DocumentIds ?? [])
            );

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new UnauthorizedAccessException("User not found.");
            }

            var hasValidConsents = await _legalService.HasValidConsentsAsync(userId);
            var newToken = _tokenService.GenerateToken(user, hasValidConsents);

            return Ok(new { success = true, accessToken = newToken });
        }

        /// <summary>
        /// Checks whether the current user has accepted all active legal documents.
        /// </summary>
        [HttpGet("status")]
        [Authorize]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetConsentStatus()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token claims.");
            }

            var hasValidConsents = await _legalService.HasValidConsentsAsync(userId);
            return Ok(new { hasValidConsents });
        }

        /// <summary>
        /// Appends the visitors cookie banner decision to the consent log (GDPR art7.1)
        /// called only by the next.js server
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("cookie-consent")]
        [AllowAnonymous]
        [RequireInternalApiKey]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [EnableRateLimiting("CookieConsentPolicy")]
        public async Task<IActionResult> RecordCookieConsent(
            [FromBody] RecordCookieConsentRequestDto request
        )
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _legalService.RecordCookieConsentAsync(request, userId);
            return NoContent();
        }
    }
}
