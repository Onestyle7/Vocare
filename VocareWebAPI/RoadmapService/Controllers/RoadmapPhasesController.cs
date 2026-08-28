using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Services.Interfaces;

namespace VocareWebAPI.RoadmapService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RoadmapPhasesController : ControllerBase
    {
        private readonly IRoadmapPhaseService _roadmapPhaseService;

        public RoadmapPhasesController(IRoadmapPhaseService roadmapPhaseService)
        {
            _roadmapPhaseService = roadmapPhaseService;
        }

        [Authorize]
        [HttpPatch("{phaseId}/name")]
        public async Task<IActionResult> UpdateName(Guid phaseId, [FromBody] string newName)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found in token.");

            var updatedPhase = await _roadmapPhaseService.UpdateNameAsync(phaseId, userId, newName);
            return Ok(MapPhaseToDto(updatedPhase));
        }

        [Authorize]
        [HttpDelete("{phaseId}")]
        public async Task<IActionResult> DeletePhase(Guid phaseId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found in token.");

            await _roadmapPhaseService.DeletePhaseAsync(phaseId, userId);
            return NoContent();
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
