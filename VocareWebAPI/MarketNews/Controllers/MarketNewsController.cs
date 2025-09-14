using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VocareWebAPI.MarketNewsService.Models.Dtos;
using VocareWebAPI.MarketNewsService.Services.interfaces;

namespace VocareWebAPI.MarketNewsService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarketNewsController : ControllerBase
    {
        private readonly IMarketNewsService _marketNewsService;
        private readonly ILogger<MarketNewsController> _logger;

        public MarketNewsController(
            IMarketNewsService marketNewsService,
            ILogger<MarketNewsController> logger
        )
        {
            _marketNewsService = marketNewsService;
            _logger = logger;
        }

        /// <summary>
        /// Pobiera 3 najnowsze newsy
        /// </summary>
        /// <returns></returns>
        [HttpGet("latest-3")]
        [AllowAnonymous]
        public async Task<ActionResult<List<MarketNewsListDto>>> GetLatest3News()
        {
            var news = await _marketNewsService.GetLatest3ForHomepageAsync();
            return Ok(news);
        }

        /// <summary>
        /// Pobiera najnowszy news dla popup na web
        /// </summary>
        /// <returns></returns>
        [HttpGet("latest")]
        [AllowAnonymous]
        public async Task<ActionResult<MarketNewsListDto>> GetLatestForPopup()
        {
            var news = await _marketNewsService.GetLatestForPopupAsync();
            if (news == null)
            {
                return NotFound("No news found for popup.");
            }
            return Ok(news);
        }

        /// <summary>
        /// Pobiera wszystkie newsy z paginacją dla web blog
        /// </summary>
        /// <param name="page"></param>
        /// <param name="pageSize"></param>
        /// <returns></returns>
        [HttpGet()]
        [AllowAnonymous]
        public async Task<ActionResult<MarketNewsPagedDto>> GetAllForBlog(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            if (page < 1 || pageSize < 1)
            {
                return BadRequest("Page and pageSize must be greater than zero.");
            }

            var pagedNews = await _marketNewsService.GetAllForBlogAsync(page, pageSize);
            return Ok(pagedNews);
        }

        /// <summary>
        /// Pobiera szczegóły newsa po ID
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<MarketNewsDetailDto>> GetNewsDetail(Guid id)
        {
            var result = await _marketNewsService.GetDetailAsync(id);
            if (result == null)
            {
                return NotFound($"News with ID {id} not found.");
            }
            return Ok(result);
        }

        /// <summary>
        /// Metoda do ręcznego wywołania generowania newsa
        /// </summary>
        /// <returns></returns>
        [HttpPost("generate-weekly")]
        [Authorize]
        [EnableRateLimiting("AiPolicy")]
        public async Task<ActionResult> GenerateNewsManually()
        {
            try
            {
                bool isGenerated = await _marketNewsService.GenerateNewsManuallyAsync();
                if (isGenerated)
                {
                    return Ok("News generated successfully.");
                }
                else
                {
                    return Conflict("A news article for this week already exists.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating news manually.");
                return StatusCode(500, "An error occurred while generating the news.");
            }
        }
    }
}
