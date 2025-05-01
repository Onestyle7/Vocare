using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Repositories.Interfaces;

namespace VocareWebAPI.Controllers
{
    /// <summary>
    /// Kontroler odpowiedzialny za operacje związane z analizą rynku pracy.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MarketAnalysisController : ControllerBase
    {
        private readonly IMarketAnalysisService _marketAnalysisService;
        private readonly IBillingService _billingService;
        private readonly ILogger<MarketAnalysisController> _logger;

        /// <summary>
        /// Inicjalizuje nową instancję kontrolera
        /// </summary>
        /// <param name="marketAnalysisService">Serwis odpowiedzialny za analizę rynku pracy.</param>
        /// <param name="billingService">Serwis do zarządzania tokenami.</param>
        /// <param name="logger">Logger do rejestrowania zdarzeń kontrolera</param>
        public MarketAnalysisController(
            IMarketAnalysisService marketAnalysisService,
            IBillingService billingService,
            ILogger<MarketAnalysisController> logger
        )
        {
            _marketAnalysisService = marketAnalysisService;
            _billingService = billingService;
            _logger = logger;
        }

        /// <summary>
        /// Pobieramy analizę rynku dla zalogowanego użytkownika
        /// </summary>
        /// <returns>Zwraca analizę rynku pracy</returns>
        [HttpGet]
        public async Task<IActionResult> GetMarketAnalysis()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
                }

                // 1. Sprawdź dostęp (subskrypcja lub tokeny)
                bool hasAccess = await _billingService.CanAccessServiceAsync(
                    userId,
                    "MarketAnalysis"
                );
                if (!hasAccess)
                {
                    return Forbid("Brak tokenów lub subskrypcja nieaktywna.");
                }

                _logger.LogInformation("Getting market analysis for user {UserId}", userId);

                // 2. Wygeneruj analizę rynku
                var result = await _marketAnalysisService.GetMarketAnalysisAsync(userId);

                // 3. Odejmij tokeny, jeśli nie ma aktywnej subskrypcji
                await _billingService.DeductTokensForServiceAsync(userId, "MarketAnalysis");

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetMarketAnalysis");
                return Problem(detail: ex.Message, statusCode: 500);
            }
        }

        [HttpGet("latest")]
        public async Task<IActionResult> GetLatestMarketAnalysis()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
                }

                var result = await _marketAnalysisService.GetLatestMarketAnalysisAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetLatestMarketAnalysis");
                return Problem(detail: ex.Message, statusCode: 500);
            }
        }
    }
}
