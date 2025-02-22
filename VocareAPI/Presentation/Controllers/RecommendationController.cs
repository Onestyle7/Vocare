using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VocareAPI.Application.Services.Interfaces;
using VocareAPI.Core.Interfaces;
using VocareAPI.Core.Interfaces.Persistence;

namespace VocareAPI.Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RecommendationController : ControllerBase
    {
        private readonly IAIService _aiService;
        private readonly VocareDbContext _context;
        private readonly ILogger<RecommendationController> _logger;
        private readonly IRecommendationHistoryService _historyService;

        public RecommendationController(IAIService aiService, VocareDbContext context, ILogger<RecommendationController> logger, IRecommendationHistoryService historyService)
        {
            _aiService = aiService;
            _context = context;
            _logger = logger;
            _historyService = historyService;
        }
        

        [HttpGet("career")]
        public async Task<IActionResult> GetCareerRecommendationAsync()
        {
            try{
                // Pobieramy identyfikator użytkownika z tokenu
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if(string.IsNullOrEmpty(userIdStr)){
                    return Unauthorized(new {message = "User not found in token"});
                }
                var userId  = Guid.Parse(userIdStr);

                // Pobieramy użytkownika z bazy danych
                var user = await _context.Users
                    .Include(u => u.UserProfile)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if(user == null || user.UserProfile == null){
                    return NotFound(new {message ="User profile not found"});   
                }

                // Wywołujemy serwis AI w celu uzyskania rekomendacji
                var recommendation = await _aiService.GetCareerRecommendationAsync(user.UserProfile);

                // Zapisujemy rekomendację w bazie danych
                await _historyService.SaveRecommendationAsync(userId, recommendation);
                return Ok(new {recommendation});
            }
            catch(Exception ex){
                _logger.LogError(ex, "Error while getting career recommendation");
                return StatusCode(500, new {message = ex.Message});
            }
        }
        [HttpGet("history")]
        public async Task<IActionResult> GetRecommendationHistory()
        {
            try{
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if(string.IsNullOrEmpty(userIdStr))
                    return Unauthorized(new {message = "User not found in token"});

                var userId = Guid.Parse(userIdStr);

                var history = await _historyService.GetRecommendationsForUserAsync(userId);

                return Ok(history);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error while getting recommendation history");
                return StatusCode(500, new {message = ex.Message});
            }
        }
    }
}