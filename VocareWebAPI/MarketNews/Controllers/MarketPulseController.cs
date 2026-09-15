using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.MarketNews.Models.Dtos;
using VocareWebAPI.MarketNews.services.interfaces;

namespace VocareWebAPI.MarketNews.Controllers
{
    [ApiController]
    [Route("api/market-pulse")]
    public class MarketPulseController : ControllerBase
    {
        private readonly IMarketPulseService _marketPulseService;
        private readonly IMarketPulseGeneratorService _marketPulseGeneratorService;
        private readonly IHostEnvironment _env;

        public MarketPulseController(
            IMarketPulseService marketPulseService,
            IMarketPulseGeneratorService marketPulseGeneratorService,
            IHostEnvironment env
        )
        {
            _marketPulseService = marketPulseService;
            _marketPulseGeneratorService = marketPulseGeneratorService;
            _env = env;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<MarketPulsePageDto>> GetPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null
        )
        {
            if (page < 1 || pageSize < 1)
                return BadRequest("Page and pageSize must be greater than 0.");

            var result = await _marketPulseService.GetPagedAsync(page, pageSize, from, to);
            return Ok(result);
        }

        [HttpGet("{slug}")]
        [AllowAnonymous]
        public async Task<ActionResult<MarketPulseDetailDto>> GetBySlug(string slug)
        {
            var result = await _marketPulseService.GetBySlugAsync(slug);
            if (result == null)
                return NotFound($"MarketPulsePost with slug '{slug}' not found.");

            return Ok(result);
        }

        /// <summary>
        /// TYMCZASOWY endpoint deweloperski do ręcznego sprawdzenia generatora bez czekania na niedzielę.
        /// Usunąć po potwierdzeniu, że integracja z OpenAI Responses API działa.
        /// </summary>
        [HttpPost("dev/generate")]
        [Authorize]
        public async Task<ActionResult> DevGenerate()
        {
            if (!_env.IsDevelopment())
                return NotFound();

            var generated = await _marketPulseGeneratorService.GenerateAsync();
            return Ok(new { generated });
        }
    }
}
