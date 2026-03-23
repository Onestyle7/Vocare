using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Models.Entities;
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
                return Ok(MapPhaseToDto(updatedPhase));
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

        #region Mapowanie
        private RoadmapPhaseResponseDto MapPhaseToDto(RoadmapPhase phase)
        {
            return new RoadmapPhaseResponseDto
            {
                Id = phase.Id,
                Title = phase.Title,
                OrderIndex = phase.OrderIndex,
                Steps =
                    phase
                        .Steps?.Select(s => new RoadmapStepResponseDto
                        {
                            Id = s.Id,
                            Title = s.Title,
                            SubTitle = s.Subtitle,
                            Description = s.Description,
                            Topics = s.Topics,
                            StepType = s.StepType.ToString(),
                            Status = s.Status.ToString(),
                            OrderIndex = s.OrderIndex,
                            ParentStepId = s.ParentStepId,
                            PositionX = s.PositionX,
                            PositionY = s.PositionY,
                        })
                        .ToList() ?? new List<RoadmapStepResponseDto>(),
                StartMonth = phase.StartMonth,
                EndMonth = phase.EndMonth,
            };
        }
        #endregion
    }
}
