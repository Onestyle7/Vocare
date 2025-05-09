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
    /// <summary>
    /// DTO dla żądania generowania CV.
    /// </summary>
    public class GenerateCvRequestDto
    {
        [StringLength(100, ErrorMessage = "Position cannot exceed 100 characters.")]
        public string? Position { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CvController : ControllerBase
    {
        private readonly ICvGenerationService _cvGenerationService;

        public CvController(ICvGenerationService cvGenerationService)
        {
            _cvGenerationService = cvGenerationService;
        }

        /// <summary>
        /// Generuje CV dla zalogowanego użytkownika na podstawie jego profilu i opcjonalnego stanowiska.
        /// </summary>
        /// <param name="request">Dane żądania zawierające opcjonalne stanowisko.</param>
        /// <returns>Wygenerowane CV w formacie DTO.</returns>
        [HttpPost("generate")]
        public async Task<ActionResult<CvDto>> GenerateCv([FromBody] GenerateCvRequestDto request)
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }

            try
            {
                var cv = await _cvGenerationService.GenerateCvAsync(userId, request.Position);
                return Ok(cv);
            }
            catch (CvGenerationService.CvGenerationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception)
            {
                return StatusCode(500, "Wystąpił błąd serwera podczas generowania CV.");
            }
        }
    }
}
