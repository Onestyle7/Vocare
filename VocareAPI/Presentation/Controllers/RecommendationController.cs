using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

        public RecommendationController(IAIService aiService, VocareDbContext context, ILogger<RecommendationController> logger)
        {
            _aiService = aiService;
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetCareerRecommendationAsync()
        {
            try{
                //1. Pobieramy id użytkownika z tokenu JWT
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if(string.IsNullOrEmpty(userId)){
                    return Unauthorized(new {message = "User not found in token"});
                }
                //2. Pobieramy profil użytkownika z bazy danych
                var user = await _context.Users
                    .Include(u => u.UserProfile)
                    .FirstOrDefaultAsync(u => u.Id == Guid.Parse(userId));

                if(user == null || user.UserProfile == null){
                    return NotFound(new {message ="User profile not found"});   
                }

                //3. Pobieramy rekomendację kariery
                var recommendation = await _aiService.GetCareerRecommendationAsync(user.UserProfile);

                return Ok(new {recommendation});
            }
            catch(Exception ex){
                _logger.LogError(ex, "Error while getting career recommendation");
                return StatusCode(500, new {message = "Internal server error"});
            }
        }
    }
}