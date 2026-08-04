using System.ComponentModel.DataAnnotations;
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
        private readonly ISkillEmbeddingService _skillEmbeddingService;
        private readonly IJobOfferDetailsService _jobOfferDetailsService;

        public JobOffersController(
            IJobOfferSyncService syncService,
            IJobOfferRepository repository,
            IJobOfferMatchingService matchingService,
            ISkillMatchingService skillMatchingService,
            ISkillEmbeddingService skillEmbeddingService,
            IJobOfferDetailsService jobOfferDetailsService
        )
        {
            _syncService = syncService;
            _repository = repository;
            _matchingService = matchingService;
            _skillMatchingService = skillMatchingService;
            _skillEmbeddingService = skillEmbeddingService;
            _jobOfferDetailsService = jobOfferDetailsService;
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
            [FromQuery] [Range(1, 10)] int limit = 5
        )
        {
            var offers = await _matchingService.GetMatchingOffersForCareerPathAsync(
                careerPathId,
                limit
            );
            return Ok(offers);
        }

        /// <summary>
        /// Pobiera oferty pracy dla wszystkich ścieżek z ostatniej rekomendacji zalogowanego użytkownika.
        /// </summary>
        /// <param name="limitPerPath">Maksymalna liczba ofert na ścieżkę (domyślnie 5)</param>
        [Authorize]
        [HttpGet("matching/my-recommendations")]
        public async Task<
            ActionResult<Dictionary<Guid, List<JobOfferMatchDto>>>
        > GetMatchingOffersForMyRecommendations([FromQuery] [Range(1, 10)] int limitPerPath = 5)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var offers = await _matchingService.GetMatchingOffersForUserAsync(userId, limitPerPath);
            return Ok(offers);
        }

        /// <summary>
        /// Generuje embeddingi dla ofert które ich nie mają.
        /// UWAGA: Może zająć dużo czasu i kosztować (OpenAI API).
        /// </summary>
        /// <param name="batchSize">Ile ofert przetworzyć (domyślnie 100)</param>
        [Authorize]
        [HttpPost("backfill-embeddings")]
        public async Task<IActionResult> BackfillEmbeddings(
            [FromQuery] [Range(1, 100)] int batchSize = 100
        )
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

        /// <summary>
        /// Pobiera oferty ze szczegółowym scoringiem dla wszystkich ścieżek zalogowanego użytkownika
        /// </summary>
        /// <param name="limitPerPath"></param>
        /// <returns></returns>
        [Authorize]
        [HttpGet("matching/my-recommendations/detailed")]
        public async Task<
            ActionResult<List<CareerPathMatchResultDto>>
        > GetDetailedMatchingOffersForUser([FromQuery] [Range(1, 10)] int limitPerPath = 5)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var result = await _matchingService.GetMatchingOffersWithScoresForUserAsync(
                userId,
                limitPerPath
            );
            return Ok(result);
        }

        [Authorize]
        [HttpGet("matching/{careerPathId:guid}/detailed")]
        public async Task<ActionResult<CareerPathMatchResultDto>> GetDetailedMatchingOffers(
            Guid careerPathId,
            [FromQuery] [Range(1, 10)] int limit = 5
        )
        {
            var result = await _matchingService.GetMatchingOffersWithScoreAsync(
                careerPathId,
                limit
            );
            return Ok(result);
        }

        [Authorize]
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<JobOfferDetailsDto>> GetJobOfferDetails(Guid id)
        {
            var jobOfferDetails = await _jobOfferDetailsService.GetDetailsByIdAsync(id);
            return Ok(jobOfferDetails);
        }

        #region DO USUNIĘCIA PO PRZEROBIENIU BACKFILLA SKILL EMBEDDINGÓW
        /// <summary>
        /// Generuje embeddingi dla wszystkich skills z ofert pracy (jednorazowy backfill)
        /// </summary>
        [Authorize]
        [HttpPost("backfill-skill-embeddings")]
        public async Task<IActionResult> BackfillSkillEmbeddings()
        {
            var result = await _skillEmbeddingService.BackfillSkillEmbeddingsAsync();
            return Ok(result);
        }
        #endregion
    }
}
