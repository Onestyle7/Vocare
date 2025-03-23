using System.Security.Claims;
using System.Text.Json;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Repositories;
using VocareWebAPI.Services;
using static VocareWebAPI.Services.PerplexityAiService;

namespace VocareWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;
        private readonly IUserProfileRepository _userProfileRepository;

        public AiController(IAiService aiService, IUserProfileRepository userProfileRepository)
        {
            _aiService = aiService;
            _userProfileRepository = userProfileRepository;
        }

        [HttpGet("recommendations")]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> GetRecommendations()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
                }

                var profile = await _userProfileRepository.GetUserProfileByIdAsync(userId);
                if (profile == null)
                {
                    return NotFound("Profil użytkownika nie został znaleziony.");
                }

                var result = await _aiService.GetCareerRecommendationsAsync(profile);
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

        [HttpGet("last-recommendation")]
        public async Task<IActionResult> GetLastRecommendation()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var profile = await _userProfileRepository.GetUserProfileByIdAsync(userId);
                if (profile == null)
                    return NotFound("Profil użytkownika nie został znaleziony.");

                if (string.IsNullOrEmpty(profile.LastRecommendationJson))
                    return NotFound("Brak ostatniej rekomendacji.");

                var recommendation = JsonSerializer.Deserialize<AiCareerResponseDto>(
                    profile.LastRecommendationJson
                );
                return Ok(recommendation);
            }
            catch (AiServiceException e)
            {
                return Problem(detail: e.Message, statusCode: 500);
            }
        }
    }
}
