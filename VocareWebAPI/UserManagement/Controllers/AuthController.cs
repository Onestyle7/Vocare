using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Models.Results;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthenticationServiceOwn _authenticationService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IAuthenticationServiceOwn authenticationService,
            ILogger<AuthController> logger
        )
        {
            _authenticationService = authenticationService;
            _logger = logger;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.LoginAsync(request.Email, request.Password);

            if (!result.IsSuccess)
            {
                if (result.Error.Contains("locked"))
                {
                    return BadRequest(new { message = result.Error, errorCode = "ACCOUNT_LOCKED" });
                }

                return BadRequest(
                    new { message = result.Error, errorCode = "INVALID_CREDENTIALS" }
                );
            }
            var login = result.Value;
            return Ok(
                new
                {
                    message = "Login successful",
                    userId = login.UserId,
                    email = login.Email,
                    /*token = login.Token, */
                    accessToken = login.Token,
                    tokenType = "Bearer",
                    expiresIn = login.ExpiresIn,
                }
            );
        }

        [HttpPost("register")]
        [AllowAnonymous]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.RegisterAsync(
                request.Email,
                request.Password
            );
            if (!result.IsSuccess)
            {
                if (result.Error.Contains("Google"))
                {
                    return BadRequest(
                        new { message = result.Error, errorCode = "GOOGLE_ACCOUNT_EXISTS" }
                    );
                }
            }
            return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.ForgotPasswordAsync(dto.Email);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.ResetPasswordAsync(
                dto.Email,
                dto.Token,
                dto.NewPassword
            );
            return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
        }

        [HttpGet("validate-reset-token")]
        [AllowAnonymous]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> ValidateResetToken(
            [FromQuery] string token,
            [FromQuery] string email
        )
        {
            var result = await _authenticationService.ValidateResetTokenAsync(token, email);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.RefreshAsync(request.RefreshToken);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var result = await _authenticationService.LogoutAsync();
            return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
        }

        [HttpPost("google-verify")]
        [AllowAnonymous]
        public async Task<IActionResult> GoogleVerify([FromBody] GoogleVerifyRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.GoogleLoginAsync(request.AccessToken);
            return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
        }
    }
}
