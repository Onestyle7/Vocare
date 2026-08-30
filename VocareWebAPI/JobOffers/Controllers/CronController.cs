using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.JobOffers.Models.Dtos;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Services.Interfaces;

namespace VocareWebAPI.JobOffers.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CronController : ControllerBase
    {
        private readonly IJobOfferSyncService _syncService;
        private readonly IConfiguration _configuration;

        public CronController(IJobOfferSyncService syncService, IConfiguration configuration)
        {
            _syncService = syncService;
            _configuration = configuration;
        }

        [HttpPost("sync")]
        public async Task<IActionResult> SyncOffers()
        {
            if (
                string.IsNullOrEmpty(_configuration["CronJobsKey"])
                || Request.Headers["X-Api-Key"].ToString() != _configuration["CronJobsKey"]
            )
            {
                return Unauthorized();
            }

            var result = await _syncService.SyncOffersAsync();
            return Ok(result);
        }

        [HttpPost("cleanup")]
        public async Task<IActionResult> CleanupStaleOffers()
        {
            if (
                string.IsNullOrEmpty(_configuration["CronJobsKey"])
                || Request.Headers["X-Api-Key"].ToString() != _configuration["CronJobsKey"]
            )
            {
                return Unauthorized();
            }
            // Robocza robota, logika nie powinna być w kontrolerze, ale dla uproszczenia tutaj ląduje. TODO: Przenieść do serwisu
            var results = new List<CleanupResult>();
            foreach (var source in Enum.GetValues<JobOfferSource>())
            {
                var result = await _syncService.CleanupStaleOffersAsync(source);
                results.Add(result);
            }
            return Ok(results);
        }
    }
}
