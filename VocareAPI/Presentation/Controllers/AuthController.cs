using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using VocareAPI.Application.DTOs;
using VocareAPI.Application.Services.Interfaces;

namespace VocareAPI.Presentation.Controllers
{
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ILogger<AuthController> _logger;
        private readonly IAuthService _authService;
        

        public AuthController(ILogger<AuthController> logger, IAuthService authService)
        {
            _logger = logger;
            _authService = authService;
        }
        [HttpPost("register")]
        
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {   
            try
            {
                var user = await _authService.RegisterUserAsync(registerDto);
    
                var token = _authService.GenerateJwtToken(user);
                return Ok(new {token});
            }

            catch (Exception ex)
            {
                return BadRequest(new {message = ex.Message});
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                var user = await _authService.LoginUserAsync(loginDto);
 
                var token = _authService.GenerateJwtToken(user);
                return Ok(new {token});
            }
            catch (Exception ex)
            {
                return BadRequest(new {message = ex.Message});
            }
        }
       
    }
}