using System.Linq.Expressions;
using System.Text.Json;
using System.Web;
using AutoMapper;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Shared.Models;
using VocareWebAPI.UserManagement.Models.Results;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Services.Implementations
{
    public class AuthenticationService : IAuthenticationServiceOwn
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly ILogger<AuthenticationService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IEmailService _emailService;
        private readonly UserRegistrationHandler _registrationHandler;
        private readonly IMarketingConsentRepository _marketingConsentRepository;

        public AuthenticationService(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            ILogger<AuthenticationService> logger,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            IHttpContextAccessor httpContextAccessor,
            IEmailService emailService,
            UserRegistrationHandler registrationHandler,
            IMarketingConsentRepository marketingConsentRepository
        )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
            _emailService = emailService;
            _registrationHandler = registrationHandler;
            _marketingConsentRepository = marketingConsentRepository;
        }

        public async Task<Result<LoginResult>> LoginAsync(string email, string password)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning("Failed login attempt for non-existent user: {Email}", email);
                return Result<LoginResult>.Failure("Invalid email or password.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(
                user,
                password,
                lockoutOnFailure: true
            );
            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                {
                    _logger.LogWarning("User account locked out: {Email}", email);
                    return Result<LoginResult>.Failure(
                        "Account is locked out. Please try again later."
                    );
                }
                _logger.LogWarning("Failed login attempt for: {Email}", email);
                return Result<LoginResult>.Failure("Invalid email or password.");
            }

            // Generuj token
            var token = GenerateIdentityCompatibleToken(user);

            _logger.LogInformation("User logged in successfully: {UserId}", user.Id);

            var loginResult = LoginResult.Successful(token, user.Id, user.Email, 3600);
            return Result<LoginResult>.Success(loginResult);
        }

        private string GenerateIdentityCompatibleToken(User user)
        {
            var protector = _httpContextAccessor
                .HttpContext.RequestServices.GetRequiredService<IDataProtectionProvider>()
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

        public async Task<Result<RegisterResult>> RegisterAsync(
            string email,
            string password,
            bool acceptMarketingConsent,
            string? ipAddress
        )
        {
            _logger.LogInformation("=== REGISTER START === Email: {Email}", email);

            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser != null)
            {
                _logger.LogWarning("User already exists: {Email}", email);

                var logins = await _userManager.GetLoginsAsync(existingUser);
                if (logins.Any(l => l.LoginProvider == "Google"))
                {
                    _logger.LogWarning("User with Google login already exists: {Email}", email);
                    return Result<RegisterResult>.Failure(
                        "User with this email already exists with Google login."
                    );
                }
                return Result<RegisterResult>.Failure(
                    "Account already exists. Please sign in using Google."
                );
            }

            var user = new User { UserName = email, Email = email };
            var result = await _userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                _logger.LogError(
                    "User creation failed for {Email}: {Errors}",
                    email,
                    string.Join(", ", result.Errors.Select(e => e.Description))
                );
                return Result<RegisterResult>.Failure("Registration failed");
            }
            if (acceptMarketingConsent)
            {
                try
                {
                    var consent = new MarketingConsent
                    {
                        UserId = user.Id,
                        IsConsentGiven = true,
                        ConsentDate = DateTime.UtcNow,
                        ConsentSource = "registration_form",
                        IpAddress = ipAddress,

                        ConsentText =
                            "Wyrażam zgodę na otrzymywanie informacji marketingowych od Vocare.",
                    };
                    await _marketingConsentRepository.CreateAsync(consent);
                    _logger.LogInformation(
                        "Marketing consent recorded for user: {UserId}",
                        user.Id
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Failed to record marketing consent for user: {UserId}",
                        user.Id
                    );
                }
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
                return Result<RegisterResult>.Failure("User registered, but billing setup failed");
            }

            _logger.LogInformation("=== REGISTER COMPLETE === UserId: {UserId}", user.Id);
            return Result<RegisterResult>.Success(RegisterResult.Successful(user.Id));
        }

        public async Task<Result<ForgotPasswordResult>> ForgotPasswordAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning(
                    "Password reset requested for non-existent email {Email}",
                    email
                );
                return Result<ForgotPasswordResult>.Success(
                    ForgotPasswordResult.Successful(
                        "If entered email is registered, a reset link will be sent."
                    )
                );
            }
            var logins = await _userManager.GetLoginsAsync(user);
            var hasGoogleLogin = logins.Any(l => l.LoginProvider == "Google");
            var hasPassword = await _userManager.HasPasswordAsync(user);
            if (hasGoogleLogin && hasPassword)
            {
                _logger.LogWarning(
                    "Password reset requested for user with both Google and password login: {Email}",
                    email
                );
                // Dla bezpieczeństwa zwracamy ten sam komunikat
                return Result<ForgotPasswordResult>.Success(
                    ForgotPasswordResult.Successful(
                        "If entered email is registered, a reset link will be sent."
                    )
                );
            }
            try
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var encodedToken = HttpUtility.UrlEncode(token);

                var frontendUrl = _configuration["Frontend:Url"] ?? "https://vocare.pl";

                var resetLink =
                    $"{frontendUrl}/reset-password?token={encodedToken}&email={HttpUtility.UrlEncode(email)}";
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

                await _emailService.SendEmailAsync(email, "Reset hasła - Vocare", emailBody);

                _logger.LogInformation("Password reset email sent to user: {UserId}", user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error sending password reset email for user: {UserId}",
                    user?.Id
                );
            }

            return Result<ForgotPasswordResult>.Success(
                ForgotPasswordResult.Successful(
                    "If entered email is registered, a reset link will be sent."
                )
            );
        }

        public async Task<Result<ResetPasswordResult>> ResetPasswordAsync(
            string email,
            string token,
            string newPassword
        )
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning(
                    "Password reset attempted for non-existent email: {Email}",
                    email
                );
                return Result<ResetPasswordResult>.Failure("Invalid email or token.");
            }

            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);

            if (!result.Succeeded)
            {
                _logger.LogWarning(
                    "Password reset failed for user: {UserId}. Errors: {Errors}",
                    user.Id,
                    string.Join(", ", result.Errors.Select(e => e.Description))
                );

                if (result.Errors.Any(e => e.Code.Contains("Password")))
                {
                    return Result<ResetPasswordResult>.Failure(
                        "Password does not meet requirements."
                    );
                }

                return Result<ResetPasswordResult>.Failure("Invalid or expired token.");
            }
            _logger.LogInformation("Password reset successful for user: {UserId}", user.Id);

            try
            {
                await _emailService.SendEmailAsync(
                    email,
                    "Hasło zostało zmienione - Vocare",
                    "Twoje hasło zostało pomyślnie zmienione. Jeśli to nie Ty, skontaktuj się z nami natychmiast."
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send password change confirmation email for user: {UserId}",
                    user.Id
                );
            }
            return Result<ResetPasswordResult>.Success(
                ResetPasswordResult.Successful("Password has been reset successfully.")
            );
        }

        public async Task<Result<ValidateResetTokenResult>> ValidateResetTokenAsync(
            string token,
            string email
        )
        {
            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(email))
            {
                return Result<ValidateResetTokenResult>.Failure("Token and email are required.");
            }

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return Result<ValidateResetTokenResult>.Failure("User not found.");
            }
            try
            {
                var isValid = await _userManager.VerifyUserTokenAsync(
                    user,
                    _userManager.Options.Tokens.PasswordResetTokenProvider,
                    "ResetPassword",
                    token
                );
                if (isValid)
                {
                    return Result<ValidateResetTokenResult>.Success(
                        ValidateResetTokenResult.Successful(true, "Token ważny")
                    );
                }
                else
                {
                    return Result<ValidateResetTokenResult>.Success(
                        ValidateResetTokenResult.Successful(
                            false,
                            "Token wygasł lub jest nieprawidłowy"
                        )
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating reset token for user: {Email}", email);
                return Result<ValidateResetTokenResult>.Failure("Błąd walidacji tokenu.");
            }
        }

        public async Task<Result<RefreshResult>> RefreshAsync(string refreshToken)
        {
            _logger.LogInformation("Refresh token request received");
            return Result<RefreshResult>.Failure("Please login again to refresh your session");
        }

        public async Task<Result<LogoutResult>> LogoutAsync()
        {
            try
            {
                var user = await _userManager.GetUserAsync(_httpContextAccessor.HttpContext.User);
                if (user != null)
                {
                    await _signInManager.SignOutAsync();
                    _logger.LogInformation("User logged out: {UserId}", user.Id);
                    return Result<LogoutResult>.Success(LogoutResult.Successful());
                }
                else
                {
                    _logger.LogWarning("Logout attempt for non-logged in user.");
                    return Result<LogoutResult>.Failure("User is not logged in.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging out user.");
                return Result<LogoutResult>.Failure("An error occurred while logging out.");
            }
        }

        public async Task<Result<GoogleLoginResult>> GoogleLoginAsync(string accessToken)
        {
            if (accessToken == null)
            {
                return Result<GoogleLoginResult>.Failure("Access token is required");
            }
            try
            {
                var response = await _httpClient.GetAsync(
                    $"https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={accessToken}"
                );
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning(
                        "Failed to validate Google access token: {StatusCode}",
                        response.StatusCode
                    );
                    return Result<GoogleLoginResult>.Failure("Invalid Google token");
                }

                var tokenInfo = await response.Content.ReadAsStringAsync();
                using var json = JsonDocument.Parse(tokenInfo);
                var email = json.RootElement.GetProperty("email").GetString();

                if (string.IsNullOrEmpty(email))
                {
                    return Result<GoogleLoginResult>.Failure("No email in Google token");
                }

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
                        _logger.LogError(
                            "Failed to create user for Google login: {Email}. Errors: {Errors}",
                            email,
                            string.Join(", ", createResult.Errors.Select(e => e.Description))
                        );
                        return Result<GoogleLoginResult>.Failure("Failed to create user account");
                    }

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
                    var logins = await _userManager.GetLoginsAsync(user);
                    var hasGoogleLogin = logins.Any(l => l.LoginProvider == "Google");

                    if (!hasGoogleLogin)
                    {
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

                var accessTokenGenerated = GenerateIdentityCompatibleToken(user);
                var refreshToken = Guid.NewGuid().ToString();

                await _userManager.SetAuthenticationTokenAsync(
                    user,
                    IdentityConstants.BearerScheme,
                    "refresh_token",
                    refreshToken
                );

                return Result<GoogleLoginResult>.Success(
                    GoogleLoginResult.Successful(
                        accessTokenGenerated,
                        refreshToken,
                        user.Id,
                        user.Email,
                        isNewUser,
                        3600
                    )
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GoogleVerify");
                return Result<GoogleLoginResult>.Failure("Google verification failed");
            }
        }
    }
}
