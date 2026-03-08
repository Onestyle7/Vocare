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
    public class RoadmapController : ControllerBase
    {
        private readonly ICareerRoadmapService _careerRoadmapService;

        public RoadmapController(ICareerRoadmapService careerRoadmapService)
        {
            _careerRoadmapService = careerRoadmapService;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateRoadmap(
            [FromBody] GenerateRoadmapRequestDto request
        )
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            try
            {
                var roadmap = await _careerRoadmapService.GenerateRoadmapAsync(
                    userId,
                    request.CareerPathId,
                    request.TimeHorizonMonths
                );

                var progress = await _careerRoadmapService.CalculateProgressAsync(
                    roadmap.Id,
                    userId
                );

                return Ok(MapToDto(roadmap, progress));
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

        [HttpGet("{roadmapId}")]
        public async Task<IActionResult> GetRoadmapById(Guid roadmapId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }
            try
            {
                var roadmap = await _careerRoadmapService.GetByIdAsync(roadmapId, userId);
                if (roadmap == null)
                {
                    return NotFound(new { Error = "Nie znaleziono roadmapy." });
                }

                var progress = await _careerRoadmapService.CalculateProgressAsync(
                    roadmap.Id,
                    userId
                );

                return Ok(MapToDto(roadmap, progress));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Wystąpił nieoczekiwany błąd." });
            }
        }

        [HttpGet("user-roadmaps")]
        public async Task<IActionResult> GetUserRoadmaps()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }
            try
            {
                var roadmaps = await _careerRoadmapService.GetUserRoadmapsAsync(userId);

                var dtos = roadmaps.Select(r => MapToListItemDto(r)).ToList();
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Wystąpił nieoczekiwany błąd." });
            }
        }

        [HttpPatch("{roadmapId}/status")]
        public async Task<IActionResult> UpdateRoadmapStatus(
            Guid roadmapId,
            [FromBody] RoadmapStatus newStatus
        )
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }
            try
            {
                await _careerRoadmapService.UpdateStatusAsync(roadmapId, userId, newStatus);
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

        [HttpDelete("{roadmapId}")]
        public async Task<IActionResult> ArchiveRoadmap(Guid roadmapId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }
            try
            {
                await _careerRoadmapService.ArchiveAsync(roadmapId, userId);
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

        [HttpGet("{roadmapId}/progress")]
        public async Task<IActionResult> GetRoadmapProgress(Guid roadmapId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            try
            {
                var progress = await _careerRoadmapService.CalculateProgressAsync(
                    roadmapId,
                    userId
                );
                return Ok(new { Progress = progress });
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

        #region  Metody pomocnicze - mapowanie encji na DTO
        private RoadmapResponseDto MapToDto(Roadmap roadmap, double progress)
        {
            return new RoadmapResponseDto
            {
                Id = roadmap.Id,
                Title = roadmap.Title,
                TimeHorizonMonths = roadmap.TimeHorizonMonths,
                Status = roadmap.Status.ToString(),
                CreatedAt = roadmap.CreatedAt,
                UpdatedAt = roadmap.UpdatedAt,
                CareerPathName = roadmap.CareerPath?.CareerName ?? "",
                Progress = progress,
                Phases = roadmap
                    .Phases.Select(p => new RoadmapPhaseResponseDto
                    {
                        Id = p.Id,
                        Title = p.Title,
                        OrderIndex = p.OrderIndex,
                        Steps = p
                            .Steps.Select(s => new RoadmapStepResponseDto
                            {
                                Id = s.Id,
                                Title = s.Title,
                                Description = s.Description,
                                Topics = s.Topics,
                                StepType = s.StepType.ToString(),
                                Status = s.Status.ToString(),
                                OrderIndex = s.OrderIndex,
                                ParentStepId = s.ParentStepId,
                                PositionX = s.PositionX,
                                PositionY = s.PositionY,
                            })
                            .ToList(),
                    })
                    .ToList(),
            };
        }

        private RoadmapListItemDto MapToListItemDto(Roadmap roadmap)
        {
            var requiredSteps = roadmap
                .Phases.SelectMany(p => p.Steps)
                .Where(s => s.StepType == StepType.Required)
                .ToList();
            var total = requiredSteps.Count;
            var completed = requiredSteps.Count(s => s.Status == StepStatus.Completed);

            return new RoadmapListItemDto
            {
                Id = roadmap.Id,
                Title = roadmap.Title,
                TimeHorizonMonths = roadmap.TimeHorizonMonths,
                Status = roadmap.Status.ToString(),
                CreatedAt = roadmap.CreatedAt,
                CareerPathName = roadmap.CareerPath?.CareerName ?? "",
                Progress = 0,
            };
        }
        #endregion
    }
}
