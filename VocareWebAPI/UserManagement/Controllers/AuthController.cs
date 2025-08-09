using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Web;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
        private readonly HttpClient _httpClient;

        public AuthController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<AuthController> logger,
            UserRegistrationHandler registrationHandler,
            IHttpClientFactory httpClientFactory
        )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
            _registrationHandler = registrationHandler;
            _httpClient = httpClientFactory.CreateClient();
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [EnableRateLimiting("LoginPolicy")]
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
                var frontendUrl = _configuration["Frontend:Url"] ?? "https://vocare.pl";
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
        [EnableRateLimiting("LoginPolicy")]
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

            var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);

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
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> ValidateResetToken(
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
                var isValid = await _userManager.VerifyUserTokenAsync(
                    user,
                    _userManager.Options.Tokens.PasswordResetTokenProvider,
                    "ResetPassword",
                    token
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
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            _logger.LogInformation("=== REGISTER START === Email: {Email}", request.Email);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for registration");
                return BadRequest(ModelState);
            }

            // Sprawdź czy użytkownik już istnieje
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                _logger.LogWarning("User already exists: {Email}", request.Email);

                var logins = await _userManager.GetLoginsAsync(existingUser);
                if (logins.Any(l => l.LoginProvider == "Google"))
                {
                    _logger.LogWarning(
                        "User with Google login already exists: {Email}",
                        request.Email
                    );
                    return BadRequest(
                        new { message = "User with this email already exists with Google login." }
                    );
                }
                return BadRequest(
                    new
                    {
                        message = "Account already exists. Please sign in using Google.",
                        authMethod = "Google",
                        suggestOAuth = true,
                    }
                );
            }

            // Standardowa rejestracja Identity
            var user = new User { UserName = request.Email, Email = request.Email };
            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                _logger.LogError(
                    "User creation failed for {Email}: {Errors}",
                    request.Email,
                    string.Join(", ", result.Errors.Select(e => e.Description))
                );
                return BadRequest(
                    new
                    {
                        message = "Registration failed",
                        errors = result.Errors.Select(e => e.Description),
                    }
                );
            }

            _logger.LogInformation(
                "=== USER CREATED === UserId: {UserId}, Email: {Email}",
                user.Id,
                user.Email
            );

            try
            {
                _logger.LogInformation(
                    "=== CALLING HandleUserRegistrationAsync === UserId: {UserId}",
                    user.Id
                );

                // Sprawdź czy handler nie jest null
                if (_registrationHandler == null)
                {
                    _logger.LogError("RegistrationHandler is NULL!");
                    throw new InvalidOperationException("RegistrationHandler is not initialized");
                }

                await _registrationHandler.HandleUserRegistrationAsync(user.Id);

                _logger.LogInformation("=== BILLING SETUP COMPLETE === UserId: {UserId}", user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "=== BILLING SETUP FAILED === UserId: {UserId}, Error: {Error}",
                    user.Id,
                    ex.Message
                );
                _logger.LogError("StackTrace: {StackTrace}", ex.StackTrace);

                return StatusCode(
                    500,
                    new
                    {
                        message = "User registered, but billing setup failed",
                        error = ex.Message,
                        userId = user.Id, // Dodajmy userId do odpowiedzi żeby móc debugować
                    }
                );
            }

            _logger.LogInformation("=== REGISTER COMPLETE === UserId: {UserId}", user.Id);
            return Ok(new { message = "User registered successfully", userId = user.Id });
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Znajdź użytkownika najpierw
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                _logger.LogWarning(
                    "Failed login attempt for non-existent user: {Email}",
                    request.Email
                );
                return BadRequest(new { message = "Invalid email or password." });
            }

            // Sprawdź hasło
            var result = await _signInManager.CheckPasswordSignInAsync(
                user,
                request.Password,
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

            // Generuj token (tak jak w GoogleVerify)
            var token = GenerateIdentityCompatibleToken(user);

            _logger.LogInformation("User logged in successfully: {UserId}", user.Id);

            return Ok(
                new
                {
                    message = "Login successful",
                    userId = user.Id,
                    email = user.Email,
                    token = token, // Dodaj token do odpowiedzi!
                    accessToken = token, // Dla kompatybilności
                    tokenType = "Bearer",
                    expiresIn = 3600,
                }
            );
        }

        // Placeholder endpoint do odświeżania tokena

        [HttpPost("refresh")]
        [AllowAnonymous]
        public IActionResult Refresh([FromBody] RefreshRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

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
                var response = await _httpClient.GetAsync(
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
                else
                {
                    // User istnieje, sprawdź czy ma login Google
                    var logins = await _userManager.GetLoginsAsync(user);
                    var hasGoogleLogin = logins.Any(l => l.LoginProvider == "Google");

                    if (!hasGoogleLogin)
                    {
                        // Dodaj Google jako metodę logowania
                        var googleUserId =
                            json.RootElement.GetProperty("user_id").GetString() ?? email;
                        await _userManager.AddLoginAsync(
                            user,
                            new UserLoginInfo("Google", googleUserId, "Google")
                        );

                        _logger.LogInformation(
                            "Added Google login to existing user: {UserId}",
                            user.Id
                        );
                    }
                }

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

                return Ok(
                    new
                    {
                        token = tokenResponse.accessToken,
                        accessToken = tokenResponse.accessToken,
                        refreshToken = tokenResponse.refreshToken,
                        expiresIn = tokenResponse.expiresIn,
                        tokenType = tokenResponse.tokenType,
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
            var protector = HttpContext
                .RequestServices.GetRequiredService<IDataProtectionProvider>()
                .CreateProtector("VocareAuth");

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
