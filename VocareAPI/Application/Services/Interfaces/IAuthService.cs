using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareAPI.Application.DTOs;
using VocareAPI.Core.Entities;

namespace VocareAPI.Application.Services.Interfaces
{
    public interface IAuthService
    {
        Task<User> RegisterUserAsync(RegisterDto registerDto);
        Task<User> LoginUserAsync(LoginDto loginDto);
        string GenerateJwtToken(User user);
    }
}