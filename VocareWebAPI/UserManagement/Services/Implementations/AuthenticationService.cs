using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Shared.Models;
using VocareWebAPI.UserManagement.Models.Results;

namespace VocareWebAPI.UserManagement.Services.Implementations
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly ILogger<AuthenticationService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthenticationService(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            ILogger<AuthenticationService> logger,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            IHttpContextAccessor httpContextAccessor
        )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<Result<LoginResult>> LoginAsync(string email, string password)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning("Failed login attempt for non-existent user: {Email}");
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
                    _logger.LogWarning("User account locked out {Email}", email);
                    return Result<LoginResult>.Failure(
                        "Account is locked out. PLease try again later"
                    );
                }
                _logger.LogWarning("Failed login attempt for user: {Email}", email);
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

        private async Task<Result<RegisterResult>> RegisterAsync(string email, string password)
        {
            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser != null)
            {
                _logger.LogWarning(
                    "Registration attempt for already existing user: {Email}",
                    email
                );
                return Result<RegisterResult>.Failure("A user with this email already exists.");
            }

            var user = new User { UserName = email, Email = email };

            var result = await _userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                var errors = string.Join(",", result.Errors.Select(e => e.Description));
                _logger.LogWarning(
                    "Failed to register user: {Email}. Errors: {Errors}",
                    email,
                    errors
                );
                return Result<RegisterResult>.Failure("Failed to register user.");
            }

            await _signInManager.SignInAsync(user, isPersistent: false);

            var token = GenerateIdentityCompatibleToken(user);

            _logger.LogInformation("User registered and logged in successfully: {UserId}", user.Id);

            return Result<RegisterResult>.Success(RegisterResult.Successful(user.Id));
        }
    }
}
