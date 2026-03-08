using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.RoadmapService.Services.Interfaces;

namespace VocareWebAPI.RoadmapService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoadmapPhasesController : ControllerBase
    {
        private readonly IRoadmapPhaseService _roadmapPhaseService;

        public RoadmapPhasesController(IRoadmapPhaseService roadmapPhaseService)
        {
            _roadmapPhaseService = roadmapPhaseService;
        }

        [HttpPatch("{phaseId}/name")]
        public async Task<IActionResult> UpdateName(Guid phaseId, [FromBody] string newName)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            try
            {
                var updatedPhase = await _roadmapPhaseService.UpdateNameAsync(
                    phaseId,
                    userId,
                    newName
                );
                return Ok(updatedPhase);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Wystąpił nieoczekiwany błąd." });
            }
        }

        [HttpDelete("{phaseId}")]
        public async Task<IActionResult> DeletePhase(Guid phaseId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            try
            {
                await _roadmapPhaseService.DeletePhaseAsync(phaseId, userId);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Wystąpił nieoczekiwany błąd." });
            }
        }
    }
}
