using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.UserManagement.Exceptions;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Repositories.Interfaces;

namespace VocareWebAPI.UserManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarketingController : ControllerBase
    {
        private readonly IMarketingConsentRepository _marketingConsentRepository;
        private readonly IUserSetupService _userSetupService;
        private readonly ILogger<MarketingController> _logger;

        public MarketingController(
            IMarketingConsentRepository marketingConsentRepository,
            ILogger<MarketingController> logger,
            IUserSetupService userSetupService
        )
        {
            _marketingConsentRepository = marketingConsentRepository;
            _userSetupService = userSetupService;
            _logger = logger;
        }

        /// <summary>
        /// Pobiera status zgody marketingowej aktualnego użytkownika
        /// </summary>
        /// <returns>Informacja czy użytkownik wyraził zgodę marketingową</returns>
        /// <response code="200">Zwraca status zgody</response>
        /// <response code="401">Jeśli użytkownik nie jest zalogowany</response>
        [HttpGet("consent")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMarketingConsent()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var consent = await _marketingConsentRepository.GetByUserIdAsync(userId);

            return Ok(
                new
                {
                    hasConsent = consent?.IsConsentGiven ?? false,
                    consentDate = consent?.ConsentDate,
                    consentWithdrawnDate = consent?.ConsentWithdrawnDate,
                }
            );
        }

        /// <summary>
        /// Udziela zgody marketingowej
        /// </summary>
        /// <returns>Potwierdzenie udzielenia zgody</returns>
        /// <response code="200">Zgoda została udzielona</response>
        /// <response code="409">Jeśli zgoda marketingowa jest już aktywna</response>
        /// <response code="401">Jeśli użytkownik nie jest zalogowany</response>
        [HttpPost("consent")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GiveMarketingConsent()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var existingConsent = await _marketingConsentRepository.GetByUserIdAsync(userId);

            if (existingConsent != null && existingConsent.IsConsentGiven)
            {
                throw new MarketingConsentAlreadyActiveException();
            }

            if (existingConsent == null)
            {
                // Utwórz nową zgodę
                var consent = new MarketingConsent
                {
                    UserId = userId,
                    IsConsentGiven = true,
                    ConsentDate = DateTime.UtcNow,
                    ConsentWithdrawnDate = null,
                    ConsentSource = "user_profile",
                    IpAddress = ipAddress,
                    ConsentText =
                        "Wyrażam zgodę na otrzymywanie informacji marketingowych od Vocare.",
                };

                await _marketingConsentRepository.CreateAsync(consent);

                _logger.LogInformation("Marketing consent granted by user: {UserId}", userId);
            }
            else
            {
                // Aktualizuj istniejącą zgodę (przywróć po wycofaniu)
                existingConsent.IsConsentGiven = true;
                existingConsent.ConsentDate = DateTime.UtcNow;
                existingConsent.ConsentWithdrawnDate = null;
                existingConsent.ConsentSource = "user_profile";
                existingConsent.IpAddress = ipAddress;

                await _marketingConsentRepository.UpdateAsync(existingConsent);

                _logger.LogInformation("Marketing consent re-granted by user: {UserId}", userId);
            }

            var welcomeBonus = await _userSetupService.GrantOrScheduleWelcomeTokensAsync(userId);
            return Ok(
                new
                {
                    message = "Zgoda marketingowa została udzielona.",
                    welcomeBonusStatus = welcomeBonus.Status,
                    welcomeTokensGranted = welcomeBonus.Amount,
                }
            );
        }

        /// <summary>
        /// Wycofuje zgodę marketingową
        /// </summary>
        /// <returns>Potwierdzenie wycofania zgody</returns>
        /// <response code="200">Zgoda została wycofana</response>
        /// <response code="422">Jeśli zgoda marketingowa nie jest aktywna</response>
        /// <response code="401">Jeśli użytkownik nie jest zalogowany</response>
        [HttpDelete("consent")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> WithdrawMarketingConsent()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var consent = await _marketingConsentRepository.GetByUserIdAsync(userId);

            if (consent == null || !consent.IsConsentGiven)
            {
                throw new MarketingConsentNotActiveException();
            }

            consent.IsConsentGiven = false;
            consent.ConsentWithdrawnDate = DateTime.UtcNow;

            await _marketingConsentRepository.UpdateAsync(consent);

            _logger.LogInformation("Marketing consent withdrawn by user: {UserId}", userId);

            return Ok(new { message = "Zgoda marketingowa została wycofana." });
        }

        /// <summary>
        /// Aktualizuje zgodę marketingową (alternatywne API z body)
        /// </summary>
        /// <param name="dto">Dane zgody</param>
        /// <returns>Potwierdzenie aktualizacji</returns>
        [HttpPut("consent")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> UpdateMarketingConsent(
            [FromBody] UpdateMarketingConsentDto dto
        )
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            if (dto.AcceptConsent)
            {
                // Używamy istniejącej logiki z POST
                return await GiveMarketingConsent();
            }
            else
            {
                // Używamy istniejącej logiki z DELETE
                return await WithdrawMarketingConsent();
            }
        }
    }
}
