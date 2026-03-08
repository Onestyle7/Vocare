using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;
using VocareWebAPI.RoadmapService.Services.Interfaces;

namespace VocareWebAPI.RoadmapService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoadmapStepsController : ControllerBase
    {
        private readonly IRoadmapStepService _roadmapStepService;

        public RoadmapStepsController(IRoadmapStepService roadmapStepService)
        {
            _roadmapStepService = roadmapStepService;
        }

        [HttpPatch("{stepId}/status")]
        public async Task<IActionResult> ChangeStatus(Guid stepId, [FromBody] StepStatus newStatus)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            try
            {
                var updatedStep = await _roadmapStepService.ChangeStatusAsync(
                    stepId,
                    userId,
                    newStatus
                );
                return Ok(MapStepToDto(updatedStep));
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

        [HttpPost("add")]
        public async Task<IActionResult> AddStep([FromBody] AddStepRequestDto newStep)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            try
            {
                var createdStep = await _roadmapStepService.AddStepAsync(
                    newStep.PhaseId,
                    userId,
                    newStep.ParentStepId,
                    newStep.Title,
                    newStep.Description,
                    newStep.Topics,
                    newStep.StepType
                );
                return Ok(MapStepToDto(createdStep));
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

        [HttpPut("{stepId}")]
        public async Task<IActionResult> UpdateStep(
            Guid stepId,
            [FromBody] UpdateStepRequestDto step
        )
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            try
            {
                var updatedStep = await _roadmapStepService.UpdateStepAsync(
                    stepId,
                    userId,
                    step.Title,
                    step.Description,
                    step.Topics,
                    step.StepType
                );
                return Ok(MapStepToDto(updatedStep));
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

        [HttpDelete("{stepId}")]
        public async Task<IActionResult> DeleteStep(Guid stepId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }
            try
            {
                await _roadmapStepService.DeleteStepAsync(stepId, userId);
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

        [HttpPatch("positions")]
        public async Task<IActionResult> UpdateStepPositions(
            [FromBody] UpdatePositionsRequestDto request
        )
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            try
            {
                var positions = request.Positions.ToDictionary(p => p.StepId, p => (p.X, p.Y));

                await _roadmapStepService.UpdateStepPositionAsync(userId, positions);
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
        private RoadmapStepResponseDto MapStepToDto(RoadmapStep step)
        {
            return new RoadmapStepResponseDto
            {
                Id = step.Id,
                Title = step.Title,
                Description = step.Description,
                Topics = step.Topics,
                StepType = step.StepType.ToString(),
                Status = step.Status.ToString(),
                OrderIndex = step.OrderIndex,
                ParentStepId = step.ParentStepId,
                PositionX = step.PositionX,
                PositionY = step.PositionY,
            };
        }
        #endregion
    }
}
