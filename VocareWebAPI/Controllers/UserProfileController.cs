using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Services;

namespace VocareWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserProfileController : ControllerBase
    {
        private readonly UserProfileService _userProfileService;

        public UserProfileController(UserProfileService userProfileService)
        {
            _userProfileService = userProfileService;
        }

        [HttpGet("GetCurrentUserProfile")]
        public async Task<IActionResult> GetCurrentUserProfile()
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }
            var profile = await _userProfileService.GetUserProfileAsync(userId);
            if (profile == null)
            {
                return NotFound("Profil użytkownika nie został znaleziony.");
            }
            return Ok(profile);
        }

        [HttpPost("CreateCurrentUserProfile")]
        public async Task<IActionResult> CreateCurrentUserProfile(
            [FromBody] UserProfileDto userProfile
        )
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }
            var profile = await _userProfileService.CreateUserProfileAsync(userId, userProfile);
            return Ok(profile);
        }

        [HttpPut("UpdateCurrentUserProfile")]
        public async Task<IActionResult> UpdateCurrentUserProfile(
            [FromBody] UserProfileDto userProfile
        )
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }
            var profile = await _userProfileService.UpdateUserProfileAsync(userId, userProfile);
            if (profile == null)
            {
                return NotFound("Profil użytkownika nie został znaleziony.");
            }
            return Ok(new { message = "Profil użytkownika został zaktualizowany." });
        }

        [HttpDelete("DeleteCurrentUserProfile")]
        public async Task<IActionResult> DeleteCurrentUserProfile()
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }
            var profile = await _userProfileService.DeleteUserProfileAsync(userId);
            if (profile == null)
            {
                return NotFound("Profil użytkownika nie został znaleziony.");
            }
            return Ok(new { message = "Profil użytkownika został usunięty." });
        }
    }
}
