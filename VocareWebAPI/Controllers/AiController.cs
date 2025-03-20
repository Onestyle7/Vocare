using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Services;

namespace VocareWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;
        private readonly IMapper _mapper;

        public AiController(IAiService aiService, IMapper mapper)
        {
            _aiService = aiService;
            _mapper = mapper;
        }

        [HttpPost("recommendations")]
        [EnableRateLimiting("AiPolicy")]
        public async Task<IActionResult> GetRecommendations([FromBody] UserProfileDto profileDto)
        {
            try
            {
                var profile = _mapper.Map<UserProfile>(profileDto);
                var result = await _aiService.GetCareerRecommendationsAsync(profile);

                return Content(result, "application/json");
            }
            catch (AiServiceException e)
            {
                return Problem(
                    title: "Błąd usługi AI",
                    detail: e.Message,
                    statusCode: StatusCodes.Status503ServiceUnavailable
                );
            }
        }
        /* Zaimplementować DTO do formatu odpowiedzi na obiektJSON */
        /*  private CareerRecommendationDto ParseResponse(string rawResponse)
         {
             return JsonSerializer.Deserialize<CareerRecommendationDto>(rawResponse);
         } */
    }
}
