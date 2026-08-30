using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Repositories.Interfaces;
using VocareWebAPI.Shared.Results;

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

        /// <summary>
        /// Inicjalizuje nową instancję kontrolera
        /// </summary>
        /// <param name="marketAnalysisService">Serwis odpowiedzialny za analizę rynku pracy.</param>
        /// <param name="billingService">Serwis do zarządzania tokenami.</param>
        /// <param name="logger">Logger do rejestrowania zdarzeń kontrolera</param>
        public MarketAnalysisController(
            IMarketAnalysisService marketAnalysisService,
            IBillingService billingService
        )
        {
            _marketAnalysisService = marketAnalysisService;
            _billingService = billingService;
        }

        /// <summary>
        /// Pobieramy analizę rynku dla zalogowanego użytkownika
        /// </summary>
        /// <returns>Zwraca analizę rynku pracy</returns>
        [HttpGet]
        public async Task<IActionResult> GetMarketAnalysis()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            await _billingService.CanAccessServiceAsync(userId, "MarketAnalysis");

            var result = await _marketAnalysisService.GetMarketAnalysisAsync(userId);
            await _billingService.DeductTokensForServiceAsync(userId, "MarketAnalysis");
            return Ok(result);
        }

        [HttpGet("latest")]
        public async Task<IActionResult> GetLatestMarketAnalysis()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var result = await _marketAnalysisService.GetLatestMarketAnalysisAsync(userId);
            return Ok(result);
        }
    }
}
