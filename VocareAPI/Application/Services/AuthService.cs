using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VocareAPI.Application.DTOs;
using VocareAPI.Application.Services.Interfaces;
using VocareAPI.Core;
using VocareAPI.Core.Entities;
using VocareAPI.Core.Interfaces.Persistence;

namespace VocareAPI.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly VocareDbContext _context;
        private readonly IMapper _mapper;
        private readonly PasswordHasher<User> _passwordHasher;
        private readonly JwtSettings _jwtSettings;

        public AuthService(VocareDbContext context, IMapper mapper, PasswordHasher<User> passwordHasher, JwtSettings jwtSettings)
        {
            _context = context;
            _mapper = mapper;
            _passwordHasher = passwordHasher;
            _jwtSettings = jwtSettings;
        }
       public async Task<User> RegisterUserAsync(RegisterDto registerDto)
       {
           //Sprawdzamy czy email i hasło nie są puste
            if(string.IsNullOrWhiteSpace(registerDto.Email))
                throw new Exception("Email nie może być pusty");
            if(string.IsNullOrWhiteSpace(registerDto.Password))
                throw new Exception("Hasło nie może być puste");

            // Sprawdzamy czy użytkownik o podanym emailu już istnieje
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == registerDto.Email);
            if(existingUser != null)
                throw new Exception("Użytkownik o podanym adresie email już istnieje");

            // Tworzymy nowego użytkownika
            var user = _mapper.Map<User>(registerDto);
            user.PasswordHash = _passwordHasher.HashPassword(user, registerDto.Password);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
       }
       public async Task<User> LoginUserAsync(LoginDto loginDto)
       {
            //Sprawdzamy czy Email lub hasło nie są puste
            if(string.IsNullOrWhiteSpace(loginDto.Email))
                throw new Exception("Email nie może być pusty");
            if(string.IsNullOrWhiteSpace(loginDto.Password))
                throw new Exception("Hasło nie może być puste");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);
            if(user == null)
                throw new Exception("Użytkownik o podanym adresie email nie istnieje");

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, loginDto.Password);
            if(result == PasswordVerificationResult.Failed)
                throw new Exception("Niepoprawne hasło");

            return user;

       }
       public string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }


    }
}