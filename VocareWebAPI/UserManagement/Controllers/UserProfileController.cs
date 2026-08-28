using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using VocareWebAPI.CareerAdvisor.Services.Interfaces;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Services;

namespace VocareWebAPI.Controllers
{
    /// <summary>
    /// Kontroler odpowiedzialny za zarządzanie profilami uzytkowników
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserProfileController : ControllerBase
    {
        private readonly ICvParserService _cvParserService;
        private readonly ILogger<UserProfileController> _logger;
        private readonly UserProfileService _userProfileService;

        /// <summary>
        /// Inicjalizuje instancję kontrolera
        /// </summary>
        /// <param name="userProfileService"></param>
        public UserProfileController(
            UserProfileService userProfileService,
            ILogger<UserProfileController> logger,
            ICvParserService cvParserService
        )
        {
            _userProfileService = userProfileService;
            _logger = logger;
            _cvParserService = cvParserService;
        }

        /// <summary>
        /// Pobiera profil aktualnego użytkownika
        /// </summary>
        /// <returns>Profil uzytkownika w foramcie DTO</returns>
        /// <response code="200">Zwraca profil użytkownika.</response>
        /// <response code="400">Jeśli brak identyfikatora użytkownika w tokenie.</response>
        /// <response code="404">Jeśli profil użytkownika nie został znaleziony.</response>
        [HttpGet("GetCurrentUserProfile")]
        public async Task<IActionResult> GetCurrentUserProfile()
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            var profile = await _userProfileService.GetUserProfileAsync(userId);

            return Ok(profile);
        }

        /// <summary>
        /// Tworzy profil dla bieżacego użytkownika
        /// </summary>
        /// <param name="userProfile">Dane profilu użytkownika</param>
        /// <returns>Utworzony profil użytkownika, lub błąd jeśli operacja nie powiodła się</returns>
        [HttpPost("CreateCurrentUserProfile")]
        public async Task<IActionResult> CreateCurrentUserProfile(
            [FromBody] UserProfileDto userProfile
        )
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }
            var profile = await _userProfileService.CreateUserProfileAsync(userId, userProfile);
            return Ok(profile);
        }

        /// <summary>
        /// Aktualizuje profil bieżącego użytkownika
        /// </summary>
        /// <param name="userProfile">Zaktualizowane dane profilu użytkownika w formacie DTO</param>
        /// <returns>Komunikat o powodzeniu lub błąd, jeśli profil nie został znaleziony</returns>
        [HttpPut("UpdateCurrentUserProfile")]
        public async Task<IActionResult> UpdateCurrentUserProfile(
            [FromBody] UserProfileDto userProfile
        )
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }
            await _userProfileService.UpdateUserProfileAsync(userId, userProfile);
            return Ok(new { message = "Profil użytkownika został zaktualizowany." });
        }

        /// <summary>
        /// Usuwa profil bieżącego użytkownika
        /// </summary>
        /// <returns>Komunikat o powodzeniu lub łąd, jeśli profil nie został znaleziony</returns>
        [HttpDelete("DeleteCurrentUserProfile")]
        public async Task<IActionResult> DeleteCurrentUserProfile()
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");
            }
            await _userProfileService.DeleteUserProfileAsync(userId);

            return Ok(new { message = "Profil użytkownika został usunięty." });
        }

        [HttpPost("import-cv")]
        public async Task<IActionResult> ImportCv(IFormFile file)
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            if (file == null || file.Length == 0)
                return BadRequest("Nie przesłano pliku");

            var profile = await _cvParserService.ParseAndSaveAsync(file, userId);
            return Ok(profile);
        }

        [HttpPut("ClearCurrentUserProfile")]
        public async Task<IActionResult> ClearCurrentUserProfile()
        {
            string userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            if (string.IsNullOrEmpty(userId))
                return BadRequest("Brak identyfikatora użytkownika w tokenie.");

            await _userProfileService.ClearUserProfileAsync(userId);

            return Ok(new { message = "Dane profilu zostały wyzerowane" });
        }
    }
}
