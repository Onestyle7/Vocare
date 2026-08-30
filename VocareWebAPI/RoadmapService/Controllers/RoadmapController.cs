using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;
using VocareWebAPI.RoadmapService.Services.Interfaces;

namespace VocareWebAPI.RoadmapService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RoadmapController : ControllerBase
    {
        private readonly ICareerRoadmapService _careerRoadmapService;

        public RoadmapController(ICareerRoadmapService careerRoadmapService)
        {
            _careerRoadmapService = careerRoadmapService;
        }

        [Authorize]
        [HttpPost("generate")]
        public async Task<IActionResult> GenerateRoadmap(
            [FromBody] GenerateRoadmapRequestDto request
        )
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found in token.");

            var roadmap = await _careerRoadmapService.GenerateRoadmapAsync(
                userId,
                request.CareerPathId,
                request.TimeHorizonMonths
            );

            return Accepted(
                new { roadmapId = roadmap.Id, generationStatus = roadmap.GenerationStatus }
            );
        }

        [Authorize]
        [HttpGet("{roadmapId}")]
        public async Task<IActionResult> GetRoadmapById(Guid roadmapId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found in token.");

            var roadmap = await _careerRoadmapService.GetByIdAsync(roadmapId, userId);

            var progress = await _careerRoadmapService.CalculateProgressAsync(roadmap.Id, userId);

            return Ok(MapToDto(roadmap, progress));
        }

        [Authorize]
        [HttpGet("user-roadmaps")]
        public async Task<IActionResult> GetUserRoadmaps()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found in token.");

            var roadmaps = await _careerRoadmapService.GetUserRoadmapsAsync(userId);

            var dtos = roadmaps.Select(r => MapToListItemDto(r)).ToList();
            return Ok(dtos);
        }

        [Authorize]
        [HttpPatch("{roadmapId}/status")]
        public async Task<IActionResult> UpdateRoadmapStatus(
            Guid roadmapId,
            [FromBody] LifecycleStatus newStatus
        )
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found in token.");

            await _careerRoadmapService.UpdateStatusAsync(roadmapId, userId, newStatus);
            return NoContent();
        }

        [Authorize]
        [HttpDelete("{roadmapId}")]
        public async Task<IActionResult> ArchiveRoadmap(Guid roadmapId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found in token.");

            await _careerRoadmapService.ArchiveAsync(roadmapId, userId);
            return NoContent();
        }

        [Authorize]
        [HttpGet("{roadmapId}/progress")]
        public async Task<IActionResult> GetRoadmapProgress(Guid roadmapId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found in token.");

            var progress = await _careerRoadmapService.CalculateProgressAsync(roadmapId, userId);
            return Ok(new { Progress = progress });
        }

        [Authorize]
        [HttpPost("{roadmapId}/retry")]
        public async Task<IActionResult> RetryGeneration(Guid roadmapId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID not found in token.");

            var roadmap = await _careerRoadmapService.RetryGenerationAsync(roadmapId, userId);
            return Accepted(new { roadmapId, roadmap.GenerationStatus });
        }

        #region  Metody pomocnicze - mapowanie encji na DTO
        private RoadmapResponseDto MapToDto(Roadmap roadmap, double progress)
        {
            return new RoadmapResponseDto
            {
                Id = roadmap.Id,
                Title = roadmap.Title,
                TimeHorizonMonths = roadmap.TimeHorizonMonths,
                Status = roadmap.LifecycleStatus.ToString(),
                CreatedAt = roadmap.CreatedAt,
                UpdatedAt = roadmap.UpdatedAt,
                CareerPathName = roadmap.CareerPath?.CareerName ?? "",
                Progress = progress,
                GenerationStatus = roadmap.GenerationStatus.ToString(),
                FailureReason = roadmap.FailureReason ?? "",
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
                            .ToList(),
                        StartMonth = p.StartMonth,
                        EndMonth = p.EndMonth,
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
                Status = roadmap.LifecycleStatus.ToString(),
                CreatedAt = roadmap.CreatedAt,
                CareerPathName = roadmap.CareerPath?.CareerName ?? "",
                Progress = 0,
                GenerationStatus = roadmap.GenerationStatus.ToString(),
                FailureReason = roadmap.FailureReason ?? "",
            };
        }
        #endregion
    }
}
