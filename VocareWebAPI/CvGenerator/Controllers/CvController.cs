using System;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Services.Implementations;
using VocareWebAPI.CvGenerator.Services.Interfaces;

namespace VocareWebAPI.CvGenerator.Controllers
{
    [ApiController]
    [Route("api/cvs")]
    [Authorize]
    public class CvController : ControllerBase
    {
        private readonly ICvManagementService _cvManagementService;
        private readonly ILogger<CvController> _logger;

        public CvController(ICvManagementService cvManagementService, ILogger<CvController> logger)
        {
            _cvManagementService = cvManagementService;
            _logger = logger;
        }

        /// <summary>
        /// Pobiera listę wszystkich CV użytkownika.
        /// </summary>
        /// <returns></returns>
        [HttpGet("my-cvs")]
        public async Task<ActionResult<List<CvListItemDto>>> GetUserCvs()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }

            try
            {
                var cv = await _cvManagementService.GetUserCvsAsync(userId);
                return Ok(cv);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating CV for user {UserId}", userId);
                return StatusCode(500, "Wystąpił błąd serwera podczas generowania CV.");
            }
        }

        /// <summary>
        /// Pobiera szczegóły konkretnego CV
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet("details/{id:guid}")]
        public async Task<ActionResult<CvDetailsDto>> GetCvDetails(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }

            try
            {
                var cv = await _cvManagementService.GetCvDetailsAsync(id, userId);
                return Ok(cv);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Nie masz dostępu do tego CV.");
            }
            catch (KeyNotFoundException)
            {
                return NotFound("CV nie zostało znalezione.");
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error getting CV details {CvId} for user {UserId}",
                    id,
                    userId
                );
                return StatusCode(500, "Wystąpił błąd podczas pobierania szczegółów CV.");
            }
        }

        /// <summary>
        /// Tworzy nowe CV
        /// </summary>
        /// <param name="createDto"></param>
        /// <returns></returns>
        [HttpPost("create")]
        public async Task<ActionResult<CvDetailsDto>> CreateCv([FromBody] CreateCvDto createDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var cv = await _cvManagementService.CreateCvAsync(userId, createDto);
                return CreatedAtAction(nameof(GetCvDetails), new { id = cv.Id }, cv);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating CV for user {UserId}", userId);
                return StatusCode(500, "Wystąpił błąd podczas tworzenia CV.");
            }
        }

        /// <summary>
        /// Aktualizuje istniejące CV
        /// </summary>
        /// <param name="id"></param>
        /// <param name="updateDto"></param>
        /// <returns></returns>
        [HttpPut("update/{id:guid}")]
        public async Task<ActionResult<CvDetailsDto>> UpdateCv(
            Guid id,
            [FromBody] UpdateCvDto updateDto
        )
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }

            if (id != updateDto.Id)
            {
                return BadRequest("ID w URL nie zgadza się z ID w body.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var cv = await _cvManagementService.UpdateCvAsync(userId, updateDto);
                return Ok(cv);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Nie masz dostępu do tego CV.");
            }
            catch (KeyNotFoundException)
            {
                return NotFound("CV nie zostało znalezione.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating CV {CvId} for user {UserId}", id, userId);
                return StatusCode(500, "Wystąpił błąd podczas aktualizacji CV.");
            }
        }

        /// <summary>
        /// Usuwa CV (soft delete)
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpDelete("delete/{id:guid}")]
        public async Task<IActionResult> DeleteCv(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }

            try
            {
                await _cvManagementService.DeleteCvAsync(id, userId);
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Nie masz dostępu do tego CV.");
            }
            catch (KeyNotFoundException)
            {
                return NotFound("CV nie zostało znalezione.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting CV {CvId} for user {UserId}", id, userId);
                return StatusCode(500, "Wystąpił błąd podczas usuwania CV.");
            }
        }

        /// <summary>
        /// Ustawia CV jako domyślne dla użytkownika.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpPut("set-default/{id:guid}")]
        public async Task<IActionResult> SetDefaultCv(Guid id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }

            try
            {
                await _cvManagementService.SetDefaultCvAsync(userId, id);
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("Nie masz dostępu do tego CV.");
            }
            catch (KeyNotFoundException)
            {
                return NotFound("CV nie zostało znalezione.");
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error setting default CV {CvId} for user {UserId}",
                    id,
                    userId
                );
                return StatusCode(500, "Wystąpił błąd podczas ustawiania domyślnego CV.");
            }
        }

        /// <summary>
        /// Sprawdza limity CV dla użytkownika.
        /// </summary>
        /// <returns></returns>
        [HttpGet("limits")]
        public async Task<IActionResult> GetCvLimits()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }

            try
            {
                var canCreate = await _cvManagementService.CanCreateNewCvAsync(userId);
                var maxLimit = await _cvManagementService.GetMaxCvLimitAsync(userId);
                var currentCvs = await _cvManagementService.GetUserCvsAsync(userId);

                return Ok(
                    new
                    {
                        canCreateNew = canCreate,
                        currentCount = currentCvs.Count,
                        maxLimit = maxLimit,
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting CV limits for user {UserId}", userId);
                return StatusCode(500, "Wystąpił błąd podczas sprawdzania limitów.");
            }
        }
    }
}
