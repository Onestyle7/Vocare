using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Models.Enums;
using VocareWebAPI.RoadmapService.Services.Interfaces;

namespace VocareWebAPI.RoadmapService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoadmapController : ControllerBase
    {
        private readonly IRoadmapService _roadmapService;

        public RoadmapController(IRoadmapService roadmapService)
        {
            _roadmapService = roadmapService;
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
                var roadmap = await _roadmapService.GenerateRoadmapAsync(
                    userId,
                    request.CareerPathId,
                    request.TimeHorizonMonths
                );

                return Ok(roadmap);
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
                var roadmap = await _roadmapService.GetByIdAsync(roadmapId, userId);
                if (roadmap == null)
                {
                    return NotFound(new { Error = "Nie znaleziono roadmapy." });
                }
                return Ok(roadmap);
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
                var roadmaps = await _roadmapService.GetUserRoadmapsAsync(userId);
                return Ok(roadmaps);
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
                await _roadmapService.UpdateStatusAsync(roadmapId, userId, newStatus);
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
                await _roadmapService.ArchiveAsync(roadmapId, userId);
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
                var progress = await _roadmapService.CalculateProgressAsync(roadmapId, userId);
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
    }
}
