using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.JobRecommendationService.Services.Interfaces;
using VocareWebAPI.Repositories;

namespace VocareWebAPI.JobRecommendationService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobrecommendationController : ControllerBase
    {
        private readonly IJobRecommendationService _jobRecommendationService;
        private readonly IBillingService _billingService;
        private readonly ILogger<JobrecommendationController> _logger;
        private readonly IAiRecommendationRepository _aiRecommendationRepository;

        public JobrecommendationController(
            IJobRecommendationService jobRecommendationService,
            IBillingService billingService,
            ILogger<JobrecommendationController> logger,
            IAiRecommendationRepository aiRecommendationRepository
        )
        {
            _jobRecommendationService = jobRecommendationService;
            _billingService = billingService;
            _logger = logger;
            _aiRecommendationRepository = aiRecommendationRepository;
        }

        [HttpGet("recommendations")]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> GetJobRecommendations()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("Brak identyfikatora użytkownika w tokenie.");

                _logger.LogInformation("Getting job recommendations for user {UserId}", userId);
                var result = await _jobRecommendationService.GetJobRecommendationsAsync(userId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetJobRecommendations");
                return Problem(detail: ex.Message, statusCode: 500);
            }
        }

        [HttpGet("generate")]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> GenerateJobRecommendations()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var hasAccess = await _billingService.CanAccessServiceAsync(
                    userId,
                    "JobRecommendations"
                );
                if (!hasAccess)
                    return Forbid("Brak tokenów lub subskrypcja nieaktywna.");

                // 1. Pobierz najnowszą career recommendation dla usera
                var latestRecommendation = await _aiRecommendationRepository.GetLatestByUserIdAsync(
                    userId
                );
                if (latestRecommendation == null)
                    return NotFound("Brak career recommendations dla tego użytkownika.");

                // 2. Wyciągnij career paths z rekomendacji
                var careerPaths = latestRecommendation
                    .CareerPaths.Select(cp => cp.CareerName)
                    .ToList();

                // 3. Wygeneruj job recommendations
                var success = await _jobRecommendationService.GenerateJobRecommendationsAsync(
                    latestRecommendation.Id,
                    careerPaths
                );

                if (success)
                {
                    await _billingService.DeductTokensForServiceAsync(userId, "JobRecommendations");
                    return Ok(
                        new
                        {
                            success = true,
                            message = "Job recommendations generated successfully",
                        }
                    );
                }
                else
                {
                    return Problem("Failed to generate job recommendations", statusCode: 500);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GenerateJobRecommendations");
                return Problem(detail: ex.Message, statusCode: 500);
            }
        }

        /// <summary>
        /// Request DTO dla generowania ofert pracy
        /// </summary>
        public class GenerateJobRecommendationsRequest
        {
            public Guid RecommendationId { get; set; }
            public List<string> CareerPaths { get; set; } = new();
        }
    }
}
