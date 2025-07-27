using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Web;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly UserRegistrationHandler _registrationHandler;

        public AuthController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<AuthController> logger,
            UserRegistrationHandler registrationHandler
        )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
            _registrationHandler = registrationHandler;
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

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Sprawdź czy użytkownik już istnieje
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return BadRequest(new { message = "User with this email already exists." });
            }

            // Standardowa rejestracja Identity
            var user = new User { UserName = request.Email, Email = request.Email };
            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                return BadRequest(
                    new
                    {
                        message = "Registration failed",
                        errors = result.Errors.Select(e => e.Description),
                    }
                );
            }

            try
            {
                // Setup billing po udanej rejestracji - to jest nasza dodatkowa logika biznesowa
                await _registrationHandler.HandleUserRegistrationAsync(user.Id);
                _logger.LogInformation(
                    "User registered successfully with billing setup: {UserId}",
                    user.Id
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to setup billing for user: {UserId}", user.Id);
                // Nie przerywamy procesu rejestracji - użytkownik zostanie utworzony
                // Ale logujemy błąd dla administratora
            }

            return Ok(new { message = "User registered successfully" });
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Ustaw scheme na Bearer dla Identity
            _signInManager.AuthenticationScheme = IdentityConstants.BearerScheme;

            var result = await _signInManager.PasswordSignInAsync(
                request.Email,
                request.Password,
                isPersistent: false,
                lockoutOnFailure: true
            );

            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                {
                    _logger.LogWarning("User account locked out: {Email}", request.Email);
                    return BadRequest(
                        new { message = "Account is locked out. Please try again later." }
                    );
                }

                _logger.LogWarning("Failed login attempt for: {Email}", request.Email);
                return BadRequest(new { message = "Invalid email or password." });
            }

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return BadRequest(new { message = "Invalid email or password." });
            }

            _logger.LogInformation("User logged in successfully: {UserId}", user.Id);
            return Ok(
                new
                {
                    message = "Login successful",
                    userId = user.Id,
                    email = user.Email,
                }
            );
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public IActionResult Refresh([FromBody] RefreshRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Identity API automatycznie obsługuje refresh tokeny przez Bearer token middleware
            // Ten endpoint jest placeholder - rzeczywista implementacja zależy od konfiguracji tokenów

            _logger.LogInformation("Refresh token request received");
            return Ok(new { message = "Please login again to refresh your session" });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            _logger.LogInformation("User logged out: {UserId}", User.Identity?.Name);
            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost("google-verify")]
        [AllowAnonymous]
        public async Task<IActionResult> GoogleVerify([FromBody] GoogleVerifyRequest request)
        {
            if (request?.AccessToken == null)
            {
                return BadRequest(new { message = "Access token is required" });
            }

            try
            {
                // Weryfikuj token Google
                using var httpClient = new HttpClient();
                var response = await httpClient.GetAsync(
                    $"https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={request.AccessToken}"
                );

                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest(new { message = "Invalid Google token" });
                }

                var tokenInfo = await response.Content.ReadAsStringAsync();
                using var json = JsonDocument.Parse(tokenInfo);
                var email = json.RootElement.GetProperty("email").GetString();

                if (string.IsNullOrEmpty(email))
                {
                    return BadRequest(new { message = "No email in Google token" });
                }

                // Znajdź/utwórz użytkownika
                var user = await _userManager.FindByEmailAsync(email);
                var isNewUser = false;

                if (user == null)
                {
                    isNewUser = true;
                    user = new User
                    {
                        UserName = email,
                        Email = email,
                        EmailConfirmed = true,
                    };

                    var createResult = await _userManager.CreateAsync(user);
                    if (!createResult.Succeeded)
                    {
                        return BadRequest(
                            new
                            {
                                message = "Failed to create user account",
                                errors = createResult.Errors,
                            }
                        );
                    }

                    // Dodaj informację o logowaniu przez Google
                    await _userManager.AddLoginAsync(
                        user,
                        new UserLoginInfo(
                            "Google",
                            json.RootElement.GetProperty("user_id").GetString() ?? email,
                            "Google"
                        )
                    );

                    await _registrationHandler.HandleUserRegistrationAsync(user.Id);
                }

                // ✅ KLUCZOWE: Dla Identity Bearer tokens musimy mieć hasło
                // Opcja A: Ustaw losowe hasło dla użytkowników Google
                /* if (!await _userManager.HasPasswordAsync(user))
                {
                    var randomPassword = GenerateRandomPassword();
                    await _userManager.AddPasswordAsync(user, randomPassword);

                    // Zapisz informację że to użytkownik Google (opcjonalnie)
                    await _userManager.SetAuthenticationTokenAsync(
                        user,
                        "Google",
                        "login_type",
                        "oauth"
                    );
                } */

                // Opcja B: Użyj Identity API do generowania tokenów
                // Stwórz HttpContext dla wewnętrznego wywołania
                var httpContext = HttpContext;
                var baseUrl = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}";

                // Przygotuj request do Identity login endpoint
                using var client = new HttpClient();
                client.BaseAddress = new Uri(baseUrl);

                // Generuj tymczasowy token dostępu
                var accessToken = await _userManager.GenerateUserTokenAsync(
                    user,
                    TokenOptions.DefaultAuthenticatorProvider,
                    "access"
                );

                // Identity Bearer Token Response format
                var tokenResponse = new
                {
                    tokenType = "Bearer",
                    accessToken = GenerateIdentityCompatibleToken(user),
                    expiresIn = 3600,
                    refreshToken = Guid.NewGuid().ToString(),
                };

                // Zapisz refresh token
                await _userManager.SetAuthenticationTokenAsync(
                    user,
                    IdentityConstants.BearerScheme,
                    "refresh_token",
                    tokenResponse.refreshToken
                );

                // Zwróć w formacie oczekiwanym przez frontend
                return Ok(
                    new
                    {
                        // Frontend szuka 'token' - daj mu to!
                        token = tokenResponse.accessToken,

                        // Dodaj też resztę dla kompatybilności
                        accessToken = tokenResponse.accessToken,
                        refreshToken = tokenResponse.refreshToken,
                        expiresIn = tokenResponse.expiresIn,
                        tokenType = tokenResponse.tokenType,

                        // Dodatkowe informacje
                        userId = user.Id,
                        email = user.Email,
                        isNewUser = isNewUser,
                        message = "Login successful",
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GoogleVerify");
                return BadRequest(new { message = "Google verification failed" });
            }
        }

        private string GenerateIdentityCompatibleToken(User user)
        {
            // ✅ Użyj Data Protection - bezpieczniej niż Base64
            var protector = HttpContext
                .RequestServices.GetRequiredService<IDataProtectionProvider>()
                .CreateProtector("VocareAuth"); // Własny purpose string

            var tokenData = new
            {
                sub = user.Id,
                email = user.Email,
                jti = Guid.NewGuid().ToString(),
                exp = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds(),
                iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            };

            var json = JsonSerializer.Serialize(tokenData);
            return protector.Protect(json);
        }
    }
}
