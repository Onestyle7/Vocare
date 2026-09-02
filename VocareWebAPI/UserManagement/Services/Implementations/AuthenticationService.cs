using System.Net.Http.Headers;
using System.Text.Json;
using System.Web;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Data;
using VocareWebAPI.Legal.Models.Enums;
using VocareWebAPI.Legal.Repositories.Interfaces;
using VocareWebAPI.Legal.Services.Interfaces;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Shared.Exceptions;
using VocareWebAPI.Shared.Results;
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
        private readonly ILegalService _legalService;
        private readonly ILegalRepository _legalRepository;
        private readonly ITokenService _tokenService;
        private readonly AppDbContext _dbContext;

        public AuthenticationService(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            ILogger<AuthenticationService> logger,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            IHttpContextAccessor httpContextAccessor,
            IEmailService emailService,
            UserRegistrationHandler registrationHandler,
            IMarketingConsentRepository marketingConsentRepository,
            ILegalService legalService,
            ILegalRepository legalRepository,
            ITokenService tokenService,
            AppDbContext dbContext
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
            _legalService = legalService;
            _legalRepository = legalRepository;
            _tokenService = tokenService;
            _dbContext = dbContext;
        }

        public async Task<Result<LoginResult>> LoginAsync(string email, string password)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning("Failed login attempt for non-existent user: {Email}", email);
                return Result<LoginResult>.Fail(
                    new Error("INVALID_CREDENTIALS", "Invalid email or password.", 401)
                );
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
                    return Result<LoginResult>.Fail(
                        new Error(
                            "ACCOUNT_LOCKED",
                            "Account is locked due to multiple failed login attempts. Please try again later.",
                            429
                        )
                    );
                }
                _logger.LogWarning("Failed login attempt for: {Email}", email);
                return Result<LoginResult>.Fail(
                    new Error("INVALID_CREDENTIALS", "Invalid email or password.", 401)
                );
            }

            var hasValidConsents = await _legalService.HasValidConsentsAsync(user.Id);
            var token = _tokenService.GenerateToken(user, hasValidConsents);

            _logger.LogInformation("User logged in successfully: {UserId}, ConsentsValid: {ConsentsValid}", user.Id, hasValidConsents);

            var loginResult = LoginResult.Successful(token, user.Id, user.Email, 3600);
            return Result<LoginResult>.Ok(loginResult);
        }

        public async Task<Result<RegisterResult>> RegisterAsync(
            string email,
            string password,
            bool acceptMarketingConsent,
            string? ipAddress
        )
        {
            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser != null)
            {
                _logger.LogWarning("User already exists: {Email}", email);

                var logins = await _userManager.GetLoginsAsync(existingUser);
                if (logins.Any(l => l.LoginProvider == "Google"))
                {
                    _logger.LogWarning("User with Google login already exists: {Email}", email);
                    return Result<RegisterResult>.Fail(
                        new Error(
                            "GOOGLE_ACCOUNT_EXISTS",
                            "An account with this email already exists via Google login",
                            409
                        )
                    );
                }

                _logger.LogWarning("User with password login already exists: {Email}", email);
                return Result<RegisterResult>.Fail(
                    new Error("ACCOUNT_EXISTS", "An account with this email already exists", 409)
                );
            }

            var user = new User { UserName = email, Email = email };

            // Robimy transakcję ponieważ obligatorijnie musimy mieć profil użytkownika zarówno w bilings jak i aspnetusers - jeśli dostaniemy faila na billing,
            // a przejdzie profil na aspnetusers, to zostaniemy z wiszącym profilem, który nie będzie mógł wywoływać żadnych usług - będzie do skasowania
            // ręcznie z bazy danych, nie mamy dedykowanych narzędzi do takich działań
            await using var transaction = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var result = await _userManager.CreateAsync(user, password);

                if (!result.Succeeded)
                {
                    _logger.LogError(
                        "User creation failed for {Email}: {Errors}",
                        email,
                        string.Join(", ", result.Errors.Select(e => e.Description))
                    );
                    // automatyczny rollback przy wyjściu z using, nie musimy ręcznie rollbackować
                    return Result<RegisterResult>.Fail(
                        new Error("REGISTRATION_FAILED", "User registration failed.")
                    );
                }

                await _registrationHandler.HandleUserRegistrationAsync(user.Id);

                await transaction.CommitAsync();

                _logger.LogInformation("User registered successfully: {UserId}", user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error during post-registration setup for user: {UserId}",
                    user.Id
                );
                return Result<RegisterResult>.Fail(
                    new Error("REGISTRATION_FAILED", "User registration failed.")
                );
            }

            try
            {
                var activeDocuments = await _legalRepository.GetActiveDocumentsAsync();
                if (activeDocuments.Count > 0)
                {
                    var userAgent = _httpContextAccessor.HttpContext?.Request.Headers.UserAgent.ToString() ?? "Registration";
                    await _legalService.AcceptConsentsAsync(
                        user.Id,
                        activeDocuments.Select(d => d.Id).ToList(),
                        ipAddress ?? "unknown",
                        userAgent,
                        ConsentSource.Registration
                    );
                    _logger.LogInformation("Legal consents recorded for registered user: {UserId}", user.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to record legal consents upon registration for user: {UserId}", user.Id);
            }

            // Zgody marketingowe są poza transakcją z tego względu, że nie są krytyczne do działania konta
            // Jeśli coś pójdzie nie tak z zapisaniem zgody to puszczamy fallback ze zgodą na false - w najgorszym przypadku nie zbierzemy zgody
            // TODO: Kiedyś może wydzielić wewnętrzy try/catch żeby bylo trochę ładniej
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
                    try
                    {
                        _logger.LogError(
                            ex,
                            "Failed to record marketing consent for user: {UserId}",
                            user.Id
                        );
                        var consent = new MarketingConsent
                        {
                            UserId = user.Id,
                            IsConsentGiven = false,
                            ConsentDate = DateTime.UtcNow,
                            ConsentSource = "registration_form",
                            IpAddress = ipAddress,
                        };
                        await _marketingConsentRepository.CreateAsync(consent);
                        _logger.LogInformation(
                            "Fallback marketing consent (not given) recorded for user: {UserId}",
                            user.Id
                        );
                    }
                    catch (Exception exception)
                    {
                        _logger.LogError(
                            exception,
                            "Failed to record marketing consent for user: {UserId}",
                            user.Id
                        );
                    }
                }
            }
            return Result<RegisterResult>.Ok(RegisterResult.Successful(user.Id));
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
                return Result<ForgotPasswordResult>.Ok(
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
                return Result<ForgotPasswordResult>.Ok(
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
                // Dla bezpieczeństwa zwracamy ten sam komunikat, nawet jeśli wysyłka emaila się nie powiodła
                return Result<ForgotPasswordResult>.Ok(
                    ForgotPasswordResult.Successful(
                        "If entered email is registered, a reset link will be sent."
                    )
                );
            }

            return Result<ForgotPasswordResult>.Ok(
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
                return Result<ResetPasswordResult>.Fail(
                    new Error("INVALID_RESET_TOKEN", "Invalid or expired token.")
                );
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
                    return Result<ResetPasswordResult>.Fail(
                        new Error(
                            "WEAK_PASSWORD",
                            "The new password does not meet complexity requirements."
                        )
                    );
                }

                return Result<ResetPasswordResult>.Fail(
                    new Error("INVALID_RESET_TOKEN", "Invalid or expired token.")
                );
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
            return Result<ResetPasswordResult>.Ok(
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
                return Result<ValidateResetTokenResult>.Fail(
                    new Error("MISSING_TOKEN_OR_EMAIL", "Token or email is missing.")
                );
            }

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return Result<ValidateResetTokenResult>.Ok(
                    ValidateResetTokenResult.Successful(false, "Token is invalid or expired.")
                );
            // Nie ujawniamy, że email jest nieprawidłowy, więc zwracamy, że token jest nieprawidłowy

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
                    return Result<ValidateResetTokenResult>.Ok(
                        ValidateResetTokenResult.Successful(true, "Token ważny")
                    );
                }
                else
                {
                    return Result<ValidateResetTokenResult>.Ok(
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
                return Result<ValidateResetTokenResult>.Fail(
                    new Error(
                        "TOKEN_VALIDATION_FAILED",
                        "An error occurred while validating the token. Please try again later."
                    )
                );
            }
        }

        public async Task<Result<RefreshResult>> RefreshAsync(string refreshToken)
        {
            // TODO: Zaimplementować - tymczasowo zwracamy błąd
            _logger.LogInformation("Refresh token request received");
            return Result<RefreshResult>.Fail(
                new Error("NOT_IMPLEMENTED", "Token refresh functionality is not implemented yet.")
            );
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
                    return Result<LogoutResult>.Ok(LogoutResult.Successful());
                }
                else
                {
                    _logger.LogWarning("Logout attempt for non-logged in user.");
                    return Result<LogoutResult>.Fail(
                        new Error("NOT_LOGGED_IN", "User is not logged in.")
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging out user.");
                return Result<LogoutResult>.Fail(
                    new Error(
                        "LOGOUT_FAILED",
                        "An error occurred while logging out. Please try again later."
                    )
                );
            }
        }

        public async Task<Result<OAuthLoginResult>> GoogleLoginAsync(string accessToken)
        {
            if (accessToken == null)
            {
                return Result<OAuthLoginResult>.Fail(
                    new Error("MISSING_GOOGLE_TOKEN", "Google access token is required.", 400)
                );
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
                    return Result<OAuthLoginResult>.Fail(
                        new Error("INVALID_GOOGLE_TOKEN", "Invalid google access token.", 400)
                    );
                }

                var tokenInfo = await response.Content.ReadAsStringAsync();
                using var json = JsonDocument.Parse(tokenInfo);
                var email = json.RootElement.GetProperty("email").GetString();

                if (string.IsNullOrEmpty(email))
                {
                    return Result<OAuthLoginResult>.Fail(
                        new Error("MISSING_GOOGLE_EMAIL", "Google token does not contain email.", 404)
                    );
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
                    await using var transaction = await _dbContext.Database.BeginTransactionAsync();
                    try
                    {
                        var createResult = await _userManager.CreateAsync(user);
                        if (!createResult.Succeeded)
                        {
                            _logger.LogError(
                                "Failed to create user for Google login: {Email}. Errors: {Errors}",
                                email,
                                string.Join(", ", createResult.Errors.Select(e => e.Description))
                            );
                            return Result<OAuthLoginResult>.Fail(
                                new Error(
                                    "GOOGLE_USER_CREATION_FAILED",
                                    "Failed to create user account for Google login.",
                                    500
                                )
                            );
                        }

                        var addLogin = await _userManager.AddLoginAsync(
                            user,
                            new UserLoginInfo(
                                "Google",
                                json.RootElement.GetProperty("user_id").GetString() ?? email,
                                "Google"
                            )
                        );
                        if (!addLogin.Succeeded)
                        {
                            _logger.LogError(
                                "Failed to add Google login to user: {Email}. Errors: {Errors}",
                                email,
                                string.Join(", ", addLogin.Errors.Select(e => e.Description))
                            );
                            return Result<OAuthLoginResult>.Fail(
                                new Error(
                                    "GOOGLE_LOGIN_ASSOCIATION_FAILED",
                                    "Failed to associate Google login with user account.",
                                    500
                                )
                            );
                        }

                        await _registrationHandler.HandleUserRegistrationAsync(user.Id);
                        await transaction.CommitAsync();

                        try
                        {
                            var activeDocuments = await _legalRepository.GetActiveDocumentsAsync();
                            if (activeDocuments.Count > 0)
                            {
                                var userAgent = _httpContextAccessor.HttpContext?.Request.Headers.UserAgent.ToString() ?? "GoogleSSO";
                                var ipAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                                await _legalService.AcceptConsentsAsync(
                                    user.Id,
                                    activeDocuments.Select(d => d.Id).ToList(),
                                    ipAddress,
                                    userAgent,
                                    ConsentSource.Registration
                                );
                                _logger.LogInformation("Legal consents recorded for Google SSO user: {UserId}", user.Id);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to record legal consents during Google registration for user: {UserId}", user.Id);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error in GoogleVerify");
                        return Result<OAuthLoginResult>.Fail(
                            new Error(
                                "GOOGLE_VERIFICATION_FAILED",
                                "Google token verification failed.",
                                500
                            )
                        );
                    }
                }
                else
                {
                    var logins = await _userManager.GetLoginsAsync(user);
                    var hasGoogleLogin = logins.Any(l => l.LoginProvider == "Google");

                    if (!hasGoogleLogin)
                    {
                        var googleUserId =
                            json.RootElement.GetProperty("user_id").GetString() ?? email;

                        var addLogin = await _userManager.AddLoginAsync(
                            user,
                            new UserLoginInfo("Google", googleUserId, "Google")
                        );

                        if (!addLogin.Succeeded)
                        {
                            _logger.LogError(
                                "Failed to add Google login to user: {Email}. Errors: {Errors}",
                                email,
                                string.Join(", ", addLogin.Errors.Select(e => e.Description))
                            );
                            return Result<OAuthLoginResult>.Fail(
                                new Error(
                                    "GOOGLE_LOGIN_ASSOCIATION_FAILED",
                                    "Failed to associate Google login with user account.",
                                    500
                                )
                            );
                        }

                        _logger.LogInformation(
                            "Added Google login to existing user: {UserId}",
                            user.Id
                        );
                    }
                }

                var hasValidConsents = await _legalService.HasValidConsentsAsync(user.Id);
                var accessTokenGenerated = _tokenService.GenerateToken(user, hasValidConsents);
                var refreshToken = Guid.NewGuid().ToString();

                try
                {
                    await _userManager.SetAuthenticationTokenAsync(
                        user,
                        IdentityConstants.BearerScheme,
                        "refresh_token",
                        refreshToken
                    );
                }
                catch (Exception ex)
                {
                    // Nie przerywamy logowania, bo to nie jest krytyczny błąd - użytkownik się zaloguje, ale nie będzie miał możliwości odświeżenia tokena, póki nie zaloguje się ponownie
                    _logger.LogError(ex, "Failed to set refresh token for user: {UserId}", user.Id);
                }

                return Result<OAuthLoginResult>.Ok(
                    OAuthLoginResult.Successful(
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
                return Result<OAuthLoginResult>.Fail(
                    new Error("GOOGLE_VERIFICATION_FAILED", "Google token verification failed.", 500)
                );
            }
        }

        public async Task<Result<OAuthLoginResult>> LinkedInLoginAsync(
            string code,
            string redirectUri
        )
        {
            if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(redirectUri))
            {
                return Result<OAuthLoginResult>.Fail(
                    new Error(
                        "MISSING_LINKEDIN_PARAMS",
                        "Authorization code and redirect URI are required."
                    )
                );
            }

            var tokenRequest = new FormUrlEncodedContent(
                new Dictionary<string, string>
                {
                    { "grant_type", "authorization_code" },
                    { "code", code },
                    { "redirect_uri", redirectUri },
                    { "client_id", _configuration["Authentication:LinkedIn:ClientId"]! },
                    { "client_secret", _configuration["Authentication:LinkedIn:ClientSecret"]! },
                }
            );

            try
            {
                var tokenResponse = await _httpClient.PostAsync(
                    $"https://www.linkedin.com/oauth/v2/accessToken",
                    tokenRequest
                );

                if (!tokenResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning(
                        "Failed to validate LinkedIn access token {StatusCode}",
                        tokenResponse.StatusCode
                    );
                    return Result<OAuthLoginResult>.Fail(
                        new Error("INVALID_LINKEDIN_TOKEN", "Invalid LinkedIn authorization code.")
                    );
                }

                var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
                using var tokenDocument = JsonDocument.Parse(tokenJson);
                var accessToken = tokenDocument.RootElement.GetProperty("access_token").GetString();

                // używamy HttpRequestMessage zamiast _httpClient.GetAsync, żeby móc umieścić Header per request
                var profileRequest = new HttpRequestMessage(
                    HttpMethod.Get,
                    "https://api.linkedin.com/v2/userinfo"
                );
                profileRequest.Headers.Authorization = new AuthenticationHeaderValue(
                    "Bearer",
                    accessToken
                );

                var profileResponse = await _httpClient.SendAsync(profileRequest);

                if (!profileResponse.IsSuccessStatusCode)
                {
                    return Result<OAuthLoginResult>.Fail(
                        new Error(
                            "LINKEDIN_PROFILE_FETCH_FAILED",
                            "Failed to fetch LinkedIn user profile."
                        )
                    );
                }

                var profileJson = await profileResponse.Content.ReadAsStringAsync();
                using var profileDocument = JsonDocument.Parse(profileJson);

                var email = profileDocument.RootElement.GetProperty("email").GetString();
                var linkedInUserId = profileDocument.RootElement.GetProperty("sub").GetString();

                if (string.IsNullOrEmpty(email))
                {
                    return Result<OAuthLoginResult>.Fail(
                        new Error(
                            "MISSING_LINKEDIN_EMAIL",
                            "LinkedIn profile does not contain email."
                        )
                    );
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
                    await using var transaction = await _dbContext.Database.BeginTransactionAsync();
                    try
                    {
                        var createResult = await _userManager.CreateAsync(user);
                        if (!createResult.Succeeded)
                        {
                            _logger.LogError(
                                "Failed to create user for LinkedIn login: {Email}. Errors: {Errors}",
                                email,
                                string.Join(", ", createResult.Errors.Select(e => e.Description))
                            );
                            return Result<OAuthLoginResult>.Fail(
                                new Error(
                                    "LINKEDIN_USER_CREATION_FAILED",
                                    "Failed to create user account for LinkedIn login."
                                )
                            );
                        }

                        var addLogin = await _userManager.AddLoginAsync(
                            user,
                            new UserLoginInfo("LinkedIn", linkedInUserId ?? email, "LinkedIn")
                        );
                        if (!addLogin.Succeeded)
                        {
                            _logger.LogError(
                                "Failed to add LinkedIn login to user: {Email}. Errors: {Errors}",
                                email,
                                string.Join(", ", addLogin.Errors.Select(e => e.Description))
                            );
                            return Result<OAuthLoginResult>.Fail(
                                new Error(
                                    "LINKEDIN_LOGIN_ASSOCIATION_FAILED",
                                    "Failed to associate LinkedIn login with user account."
                                )
                            );
                        }

                        await _registrationHandler.HandleUserRegistrationAsync(user.Id);
                        await transaction.CommitAsync();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error in LinkedIn Login");
                        return Result<OAuthLoginResult>.Fail(
                            new Error(
                                "LINKEDIN_VERIFICATION_FAILED",
                                "LinkedIn token verification failed."
                            )
                        );
                    }
                }
                else
                {
                    var logins = await _userManager.GetLoginsAsync(user);
                    var hasLinkedInLogin = logins.Any(l => l.LoginProvider == "LinkedIn");

                    if (!hasLinkedInLogin)
                    {
                        var addlogin = await _userManager.AddLoginAsync(
                            user,
                            new UserLoginInfo("LinkedIn", linkedInUserId ?? email, "LinkedIn")
                        );
                        if (!addlogin.Succeeded)
                        {
                            _logger.LogError(
                                "Failed to add Linkedin login to user: {Email}. Errors: {Errors}",
                                email,
                                string.Join(", ", addlogin.Errors.Select(e => e.Description))
                            );
                            return Result<OAuthLoginResult>.Fail(
                                new Error(
                                    "LINKEDIN_LOGIN_ASSOCIATION_FAILED",
                                    "Failed to associate Linkedin login with user account."
                                )
                            );
                        }
                    }
                }
                var hasValidConsents = await _legalService.HasValidConsentsAsync(user.Id);
                var accessTokenGenerated = _tokenService.GenerateToken(user, hasValidConsents);
                var refreshToken = Guid.NewGuid().ToString();

                try
                {
                    await _userManager.SetAuthenticationTokenAsync(
                        user,
                        IdentityConstants.BearerScheme,
                        "refresh_token",
                        refreshToken
                    );
                }
                catch (Exception ex)
                {
                    // Nie przerywamy logowania, bo to nie jest krytyczny błąd - użytkownik się zaloguje, ale nie będzie miał możliwości odświeżenia tokena, póki nie zaloguje się ponownie
                    _logger.LogError(ex, "Failed to set refresh token for user: {UserId}", user.Id);
                }

                return Result<OAuthLoginResult>.Ok(
                    OAuthLoginResult.Successful(
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
                _logger.LogError(ex, "Error in LinkedIn login");
                return Result<OAuthLoginResult>.Fail(
                    new Error(
                        "LINKEDIN_VERIFICATION_FAILED",
                        "An error occurred during LinkedIn login. Please try again later."
                    )
                );
            }
        }
    }
}
