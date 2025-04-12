using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        private readonly ILogger<MarketAnalysisController> _logger;

        /// <summary>
        /// Inicjalizuje nową instancję kontrolera
        /// </summary>
        /// <param name="marketAnalysisService">Serwis odpowiedzialny za analizę rynku pracy.</param>
        /// <param name="logger">Logger do rejestrowania zdarzeń kontrolera</param>
        public MarketAnalysisController(
            IMarketAnalysisService marketAnalysisService,
            ILogger<MarketAnalysisController> logger
        )
        {
            _marketAnalysisService = marketAnalysisService;
            _logger = logger;
        }

        /// <summary>Pobieramy analizę rynku dla zalogowanego użytkownika</summary>
        /// <returns>Zwraca analizę rynku pracy</returns>
        [HttpGet]
        public async Task<IActionResult> GetMarketAnalysis()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation("Getting market analysis for user {UserId}", userId);
                var result = await _marketAnalysisService.GetMarketAnalysisAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, statusCode: 500);
            }
        }
    }
}
