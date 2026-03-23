using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
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
    }
}
