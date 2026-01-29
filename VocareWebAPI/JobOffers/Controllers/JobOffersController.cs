using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.JobOffers.Models.Dtos;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Interfaces;

namespace VocareWebAPI.JobOffers.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobOffersController : ControllerBase
    {
        private readonly IJobOfferSyncService _syncService;
        private readonly IJobOfferRepository _repository;
        private readonly IJobOfferMatchingService _matchingService;
        private readonly ISkillMatchingService _skillMatchingService;

        public JobOffersController(
            IJobOfferSyncService syncService,
            IJobOfferRepository repository,
            IJobOfferMatchingService matchingService,
            ISkillMatchingService skillMatchingService
        )
        {
            _syncService = syncService;
            _repository = repository;
            _matchingService = matchingService;
            _skillMatchingService = skillMatchingService;
        }

        [Authorize]
        [HttpPost("sync")]
        public async Task<IActionResult> Sync()
        {
            var result = await _syncService.SyncOffersAsync();
            return Ok(result);
        }

        [Authorize]
        [HttpGet("count")]
        public async Task<IActionResult> GetCount()
        {
            var count = await _repository.GetCountAsync();
            return Ok(new { count });
        }

        /// <summary>
        /// Pobiera oferty pracy pasujące do konkretnej ścieżki kariery.
        /// </summary>
        /// <param name="careerPathId">ID ścieżki kariery</param>
        /// <param name="limit">Maksymalna liczba ofert (domyślnie 5)</param>
        [Authorize]
        [HttpGet("matching/{careerPathId:guid}")]
        public async Task<ActionResult<List<JobOfferMatchDto>>> GetMatchingOffers(
            Guid careerPathId,
            [FromQuery] int limit = 5
        )
        {
            try
            {
                var offers = await _matchingService.GetMatchingOffersForCareerPathAsync(
                    careerPathId,
                    limit
                );
                return Ok(offers);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, statusCode: 500);
            }
        }

        /// <summary>
        /// Pobiera oferty pracy dla wszystkich ścieżek z ostatniej rekomendacji zalogowanego użytkownika.
        /// </summary>
        /// <param name="limitPerPath">Maksymalna liczba ofert na ścieżkę (domyślnie 5)</param>
        [Authorize]
        [HttpGet("matching/my-recommendations")]
        public async Task<
            ActionResult<Dictionary<Guid, List<JobOfferMatchDto>>>
        > GetMatchingOffersForMyRecommendations([FromQuery] int limitPerPath = 5)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("Brak identyfikatora użytkownika w tokenie.");
            }

            try
            {
                var offers = await _matchingService.GetMatchingOffersForUserAsync(
                    userId,
                    limitPerPath
                );
                return Ok(offers);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, statusCode: 500);
            }
        }

        /// <summary>
        /// Generuje embeddingi dla ofert które ich nie mają.
        /// UWAGA: Może zająć dużo czasu i kosztować (OpenAI API).
        /// </summary>
        /// <param name="batchSize">Ile ofert przetworzyć (domyślnie 100)</param>
        [Authorize]
        [HttpPost("backfill-embeddings")]
        public async Task<IActionResult> BackfillEmbeddings([FromQuery] int batchSize = 100)
        {
            try
            {
                var result = await _syncService.BackfillEmbeddingsAsync(batchSize);
                return Ok(
                    new
                    {
                        message = "Backfill zakończony",
                        processed = result.Processed,
                        failed = result.Failed,
                        remaining = result.Remaining,
                    }
                );
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, statusCode: 500);
            }
        }

        /// <summary>
        /// TYMCZASOWY - test skill matching
        /// </summary>
        [HttpGet("test-skill-matching")]
        public async Task<IActionResult> TestSkillMatching()
        {
            var required = new List<string> { "Figma", "UX Research", "Prototypowanie" };
            var offered = new List<string> { "Figma", "User Research", "Wireframing", "Sketch" };

            var result = await _skillMatchingService.CalculateSkillMatchAsync(required, offered);

            return Ok(result);
        }
    }
}
