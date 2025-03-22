using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VocareWebAPI.Repositories;
using VocareWebAPI.Services;

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
        /* Zaimplementować DTO do formatu odpowiedzi na obiektJSON */
        /*  private CareerRecommendationDto ParseResponse(string rawResponse)
         {
             return JsonSerializer.Deserialize<CareerRecommendationDto>(rawResponse);
         } */
    }
}
