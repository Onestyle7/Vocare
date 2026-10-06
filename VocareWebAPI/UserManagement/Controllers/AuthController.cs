using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VocareWebAPI.Shared.Results;
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
        private readonly IUserDeletionService _userDeletionService;

        public AuthController(
            IAuthenticationServiceOwn authenticationService,
            IUserDeletionService userDeletionService
        )
        {
            _authenticationService = authenticationService;
            _userDeletionService = userDeletionService;
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
                return result.ToActionResult().Result;

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
        public async Task<ActionResult<RegisterResult>> Register([FromBody] RegisterDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.RegisterAsync(
                request.Email,
                request.Password,
                request.AcceptMarketingConsent,
                HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            if (!result.IsSuccess)
                return result.ToActionResult();

            return Ok(result.Value);
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<ActionResult<ForgotPasswordResult>> ForgotPassword(
            [FromBody] ForgotPasswordDto dto
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.ForgotPasswordAsync(dto.Email);

            if (!result.IsSuccess)
                return result.ToActionResult();

            return Ok(result.Value);
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<ActionResult<ResetPasswordResult>> ResetPassword(
            [FromBody] ResetPasswordDto dto
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.ResetPasswordAsync(
                dto.Email,
                dto.Token,
                dto.NewPassword
            );

            if (!result.IsSuccess)
                return result.ToActionResult();

            return Ok(result.Value);
        }

        [HttpGet("validate-reset-token")]
        [AllowAnonymous]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<ActionResult<ValidateResetTokenResult>> ValidateResetToken(
            [FromQuery] string token,
            [FromQuery] string email
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.ValidateResetTokenAsync(token, email);

            if (!result.IsSuccess)
                return result.ToActionResult();

            return Ok(result.Value);
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<ActionResult<RefreshResult>> Refresh([FromBody] RefreshRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.RefreshAsync(request.RefreshToken);

            if (!result.IsSuccess)
                return result.ToActionResult();

            return Ok(result.Value);
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult<LogoutResult>> Logout()
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.LogoutAsync();

            if (!result.IsSuccess)
                return result.ToActionResult();

            return Ok(result.Value);
        }

        [HttpPost("google-verify")]
        [AllowAnonymous]
        public async Task<ActionResult<OAuthLoginResult>> GoogleVerify(
            [FromBody] GoogleVerifyRequest request
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.GoogleLoginAsync(request.AccessToken);

            if (!result.IsSuccess)
                return result.ToActionResult();

            return Ok(result.Value);
        }

        [HttpPost("linkedin-verify")]
        [AllowAnonymous]
        public async Task<ActionResult<OAuthLoginResult>> LinkedinVerify(
            [FromBody] LinkedInVerifyRequest request
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authenticationService.LinkedInLoginAsync(
                request.Code,
                request.RedirectUri
            );

            if (!result.IsSuccess)
                return result.ToActionResult();

            return Ok(result.Value);
        }

        [HttpDelete("account")]
        [Authorize]
        public async Task<ActionResult<bool>> DeleteAccount([FromBody] DeleteAccountRequestDto? request = null)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ProblemDetails
                {
                    Status = StatusCodes.Status401Unauthorized,
                    Title = "Unauthorized",
                    Detail = "User ID not found in token."
                });
            }

            var result = await _userDeletionService.DeleteCurrentUserAsync(userId, request?.Password);
            if (!result.IsSuccess)
            {
                return result.ToActionResult();
            }

            return Ok(true);
        }
    }
}
