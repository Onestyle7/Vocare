using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Repositories;
using VocareWebAPI.Services;
using static VocareWebAPI.Services.PerplexityAiService;

namespace VocareWebAPI.Controllers
{
    /// <summary>
    /// Controller do obsługi rekomendacji AI.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;
        private readonly IUserProfileRepository _userProfileRepository;
        private IBillingService _billingService;

        /// <summary>
        /// Inicjalizuje nową instancję kontrolera AiController.
        /// </summary>
        /// <param name="aiService">Serwis AI do generowania rekomendacji.</param>
        /// <param name="userProfileRepository">Repozytorium profili użytkownika</param>
        public AiController(
            IAiService aiService,
            IUserProfileRepository userProfileRepository,
            IBillingService billingService
        )
        {
            _billingService = billingService;
            _aiService = aiService;
            _userProfileRepository = userProfileRepository;
        }

        /// <summary>
        /// Pobiera rekomendacje kariery na podstawie profilu użytkownika.
        /// </summary>
        /// <returns>Zwraca rekomendacje zawodowe</returns>
        [HttpGet("recommendations")]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> GetRecommendations()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            await _billingService.CanAccessServiceAsync(userId, "AnalyzeProfile");

            var profile = await _userProfileRepository.GetUserProfileByIdAsync(userId);

            var result = await _aiService.GetCareerRecommendationsAsync(profile);

            await _billingService.DeductTokensForServiceAsync(userId, "AnalyzeProfile");

            return Ok(result);
        }

        /// <summary>
        /// Pobiera ostatnią rekomendację zawodową dla zalogowanego użytkownika.
        /// </summary>
        /// <returns></returns>
        [HttpGet("last-recommendation")]
        public async Task<IActionResult> GetLastRecommendation()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var recommendation = await _aiService.GetLastRecommendationAsync(userId);

            return Ok(recommendation);
        }
    }
}
