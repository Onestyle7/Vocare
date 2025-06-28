using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
                return Unauthorized("Brak identyfikatora użytkownika w tokenie.");

            // 1. sprawdź saldo / subskrypcję
            var hasAccess = await _billingService.CanAccessServiceAsync(userId, "AnalyzeProfile");
            if (!hasAccess)
                return Forbid("Brak tokenów lub subskrypcja nieaktywna.");

            // 2. pobierz dane profilu
            var profile = await _userProfileRepository.GetUserProfileByIdAsync(userId);
            if (profile is null)
                return NotFound("Profil użytkownika nie został znaleziony.");

            try
            {
                // 3. generuj rekomendację
                var result = await _aiService.GetCareerRecommendationsAsync(profile);

                // 4. odejmij tokeny (jeśli user nie ma aktywnej subskrypcji)
                await _billingService.DeductTokensForServiceAsync(userId, "AnalyzeProfile");

                return Ok(result);
            }
            catch (AiServiceException e)
            {
                return Problem(
                    title: "Błąd usługi AI",
                    detail: e.Message,
                    statusCode: StatusCodes.Status503ServiceUnavailable
                );
            }
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
                return Unauthorized();

            try
            {
                var recommendation = await _aiService.GetLastRecommendationAsync(userId);
                if (recommendation == null)
                    return NotFound("Brak ostatniej rekomendacji.");

                return Ok(recommendation);
            }
            catch (AiServiceException ex) when (ex.Message.Contains("No recommendation found"))
            {
                return NotFound("No previous recommendation found for the user");
            }
        }
    }
}
