using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using VocareAPI.Application.DTOs;
using VocareAPI.Application.Services.Interfaces;

namespace VocareAPI.Presentation.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : Controller
    {
        private readonly IProfileService _profileService;
        private readonly ILogger<ProfileController> _logger;

        public ProfileController(ILogger<ProfileController> logger, IProfileService profileService)
        {
            _logger = logger;
            _profileService = profileService;
        }

        [HttpPost("profile")]
        public async Task<IActionResult> PostProfile([FromBody] UserProfileDto userProfileDto)
        {
            try
            {
                await _profileService.SaveUserProfileAsync(userProfileDto);
                return Ok(new {message = "Profile saved successfully"});
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving user profile");
                return BadRequest(new {message = ex.Message});
            }
        }
    }
}