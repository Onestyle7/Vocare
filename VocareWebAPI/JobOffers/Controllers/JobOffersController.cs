using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

        public JobOffersController(IJobOfferSyncService syncService, IJobOfferRepository repository)
        {
            _syncService = syncService;
            _repository = repository;
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
    }
}
