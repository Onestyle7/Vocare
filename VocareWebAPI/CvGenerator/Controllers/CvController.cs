using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.CvGenerator.Interfaces;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Shared.Results;

namespace VocareWebAPI.CvGenerator.Controllers
{
    [ApiController]
    [Route("api/cvs")]
    [Authorize]
    public class CvController : ControllerBase
    {
        private readonly ICvManagementService _cvManagementService;
        private readonly ICvAnalysisService _cvAnalysisService;
        private readonly ICvTailoringService _cvTailoringService;
        private readonly IBillingService _billingService;

        public CvController(
            ICvManagementService cvManagementService,
            ICvAnalysisService cvAnalysisService,
            ICvTailoringService cvTailoringService,
            IBillingService billingService
        )
        {
            _cvManagementService = cvManagementService;
            _cvAnalysisService = cvAnalysisService;
            _cvTailoringService = cvTailoringService;
            _billingService = billingService;
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
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var cv = await _cvManagementService.GetUserCvsAsync(userId);
            return Ok(cv);
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
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var cv = await _cvManagementService.GetCvDetailsAsync(id, userId);
            return Ok(cv);
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
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _cvManagementService.CreateCvAsync(userId, createDto);
            if (!result.IsSuccess)
                return result.ToActionResult();

            return CreatedAtAction(
                nameof(GetCvDetails),
                new { id = result.Value!.Id },
                result.Value
            );
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
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            if (id != updateDto.Id)
                return BadRequest("Id CV w URL musi być zgodne z Id w ciele żądania.");

            var cv = await _cvManagementService.UpdateCvAsync(userId, updateDto);
            return Ok(cv);
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
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            await _cvManagementService.DeleteCvAsync(id, userId);
            return NoContent();
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
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            await _cvManagementService.SetDefaultCvAsync(userId, id);
            return NoContent();
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
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

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

        [HttpPost("analyze/{cvId}")]
        public async Task<ActionResult<CvAnalysisResultDto>> AnalyzeCvAsync(Guid cvId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var hasAccess = await _billingService.CanAccessServiceAsync(userId, "AnalyzeCv");
            if (!hasAccess)
                return Forbid("Zbyt mało tokenów lub nieaktywna subskrypcja");

            var analysis = await _cvAnalysisService.AnalyzeCvAsync(cvId, userId);
            await _billingService.DeductTokensForServiceAsync(userId, "AnalyzeCv");
            return Ok(analysis);
        }

        [HttpGet("analysis/{cvId}")]
        public async Task<ActionResult<CvAnalysisResultDto>> GetAnalysisAsync(Guid cvId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var analysis = await _cvAnalysisService.GetAnalysisAsync(cvId, userId);

            return Ok(analysis);
        }

        [HttpPost("tailor")]
        public async Task<ActionResult<CvDetailsDto>> TailorCvAsync([FromBody] TailorCvDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var hasAccess = await _billingService.CanAccessServiceAsync(userId, "TailorCv");
            if (!hasAccess)
                return Forbid("Zbyt mało tokenów lub nieaktywna subskrypcja");

            var cv = await _cvTailoringService.TailorCvAsync(dto, userId);
            await _billingService.DeductTokensForServiceAsync(userId, "TailorCv");
            return Ok(cv);
        }

        [HttpPost("generate-from-profile")]
        public async Task<ActionResult<CvDetailsDto>> GenerateCvFromProfileAsync(
            [FromBody] GenerateCvFromProfileDto dto
        )
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var hasAccess = await _billingService.CanAccessServiceAsync(
                userId,
                "GenerateCvFromProfile"
            );

            if (!hasAccess)
                return Forbid("Zbyt mało tokenów lub nieaktywna subskrypcja");

            var result = await _cvTailoringService.GenerateCvFromProfileAsync(dto, userId);
            if (!result.IsSuccess)
                return result.ToActionResult();

            await _billingService.DeductTokensForServiceAsync(userId, "GenerateCvFromProfile");
            return Ok(result.Value);
        }
    }
}
