using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VocareAPI.Application.DTOs;
using VocareAPI.Application.Services.Interfaces;
using VocareAPI.Core.Entities;
using VocareAPI.Core.Interfaces.Persistence;

namespace VocareAPI.Application.Services
{
    public class ProfileService : IProfileService
    {
        private readonly VocareDbContext _dbContext;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ProfileService(VocareDbContext dbContext, IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = dbContext;
            _httpContextAccessor = httpContextAccessor;
        }
        

        public async Task SaveUserProfileAsync(UserProfileDto userProfileDto)
        {
            try
            {
                // Uzyskujemy HttpContext z wstrzykniętego IHttpContextAccessor
                var httpContext = _httpContextAccessor.HttpContext;
                if (httpContext == null)
                    throw new Exception("HttpContext is null");
                    
                // Pobieramy UserId z tokena JWT w HttpContext
                var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier).Value;
                if(string.IsNullOrEmpty(userId))
                    throw new UnauthorizedAccessException("User not found");

                var user = _dbContext.Users.Include(u => u.UserProfile)
                    .FirstOrDefault(u => u.Id == Guid.Parse(userId));

                if(user == null)
                    throw new Exception("User not found");
                
                // Jeśli użytkownik nie ma jeszcze profilu, tworzymy nowy obiekt UserProfile
                if(user.UserProfile == null)
                {
                    user.UserProfile = new UserProfile();
                }

                // Aktualizacja profilu użytkownika
                user.UserProfile.Name = userProfileDto.Name;
                user.UserProfile.Surname = userProfileDto.Surname;
                user.UserProfile.PhoneNumber = userProfileDto.PhoneNumber;
                user.UserProfile.Experience = userProfileDto.Experience;
                user.UserProfile.Skills = userProfileDto.Skills;
                user.UserProfile.Interests = userProfileDto.Interests;
                user.UserProfile.Goals = userProfileDto.Goals;

                await _dbContext.SaveChangesAsync();
            }
            catch (Exception e)
            {
                throw new Exception("Error saving user profile", e);
            }
            
        }
    }
}