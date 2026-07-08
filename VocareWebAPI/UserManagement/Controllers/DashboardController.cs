using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var summary = await _dashboardService.GetDashboardSummaryAsync(userId);
            return Ok(summary);
        }

        [HttpGet("profile-attributes")]
        public async Task<IActionResult> GetProfileAttributes()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkowniak w tokenie.");

            var attributes = await _dashboardService.GetProfileAttributesAsync(userId);
            return Ok(attributes);
        }
    }
}
