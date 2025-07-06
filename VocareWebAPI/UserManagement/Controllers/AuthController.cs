using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualBasic;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<IdentityUser> userManager,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<AuthController> logger
        )
        {
            _userManager = userManager;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(dto.Email);

            // Zawsze zwracamy sukces (200 OK) dla bezpieczeństwa
            if (user == null)
            {
                _logger.LogWarning(
                    "Password reset requested for non-existent email {Email}",
                    dto.Email
                );
                return Ok(
                    new { message = "If entered email is registered, a reset link will be sent." }
                );
            }
            try
            {
                // Generuj token resetu (Identity automatycznie zarządza czasem życia)
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);

                // Koduj token dla URL
                var encodedToken = HttpUtility.UrlEncode(token);

                // Buduj link
                var frontendUrl = _configuration["Frontend:Url"] ?? "https://app.vocare.pl";
                var resetLink =
                    $"{frontendUrl}/reset-password?token={encodedToken}&email={HttpUtility.UrlEncode(dto.Email)}";

                // Przygotuj email
                var emailBody =
                    $@"
Cześć {user.UserName},

Otrzymaliśmy prośbę o reset hasła dla Twojego konta w Vocare.

Aby ustawić nowe hasło, kliknij poniższy link:
{resetLink}

Link jest ważny przez 24 godziny.

Jeśli nie prosiłeś o reset hasła, możesz zignorować tę wiadomość.

Pozdrawiamy,
Zespół Vocare
";

                await _emailService.SendEmailAsync(dto.Email, "Reset hasła - Vocare", emailBody);

                _logger.LogInformation("Password reset email sent to user: {UserId}", user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending password reset email");
                // Nie informujemy użytkownika o błędzie (bezpieczeństwo)
            }

            return Ok(
                new { message = "If entered email is registered, a reset link will be sent." }
            );
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                _logger.LogWarning(
                    "Password reset attempted for non-existent email: {Email}",
                    dto.Email
                );
                return BadRequest(new { message = "Invalid email or token." });
            }
            // Dekoduj token
            var decodedToken = HttpUtility.UrlDecode(dto.Token);

            var result = await _userManager.ResetPasswordAsync(user, decodedToken, dto.NewPassword);

            if (!result.Succeeded)
            {
                _logger.LogWarning(
                    "Password reset failed for user: {UserId}. Errors: {Errors}",
                    user.Id,
                    string.Join(", ", result.Errors.Select(e => e.Description))
                );

                // Zwróć błędy walidacji hasła jeśli są
                if (result.Errors.Any(e => e.Code.Contains("Password")))
                {
                    return BadRequest(
                        new
                        {
                            message = "Password does not meet requirements.",
                            errors = result.Errors.Select(e => e.Description),
                        }
                    );
                }

                return BadRequest(new { message = "Invalid or expired token." });
            }
            _logger.LogInformation("Password reset successful for user: {UserId}", user.Id);
            // Opcjonalnie: wyślij mail potwierdzający
            try
            {
                await _emailService.SendEmailAsync(
                    dto.Email,
                    "Hasło zostało zmienione - Vocare",
                    "Twoje hasło zostało pomyślnie zmienione. Jeśli to nie Ty, skontaktuj się z nami natychmiast."
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password change confirmation email");
            }
            return Ok(new { message = "Password has been reset successfully." });
        }

        [HttpGet("validate-reset-token")]
        [AllowAnonymous]
        public async Task<IActionResult> ValudateResetToken(
            [FromQuery] string token,
            [FromQuery] string email
        )
        {
            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(email))
            {
                return BadRequest(new { message = "Token and email are required." });
            }

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            try
            {
                var decodedToken = HttpUtility.UrlDecode(token);

                // Identity nie ma metody do samej walidacji, więc używamy VerifyUserTokenAsync
                var isValid = await _userManager.VerifyUserTokenAsync(
                    user,
                    _userManager.Options.Tokens.PasswordResetTokenProvider,
                    "ResetPassword",
                    decodedToken
                );

                return Ok(
                    new
                    {
                        isValid,
                        message = isValid ? "Token ważny" : "Token wygasł lub jest nieprawidłowy",
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating reset token");
                return Ok(new { isValid = false, message = "Błąd walidacji tokenu." });
            }
        }
    }
}
