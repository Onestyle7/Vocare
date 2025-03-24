using AutoMapper;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Services
{
    public class UserProfileService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public UserProfileService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<UserProfileDto> GetUserProfileAsync(string UserId)
        {
            var profile = await _context.UserProfiles.FirstOrDefaultAsync(u => u.UserId == UserId);
            if (profile == null)
            {
                return null;
            }
            return _mapper.Map<UserProfileDto>(profile);
        }

        public async Task<UserProfileDto> CreateUserProfileAsync(
            string UserId,
            UserProfileDto userProfileDto
        )
        {
            var profile = await _context.UserProfiles.FindAsync(UserId);
            if (profile == null)
            {
                profile = new UserProfile { UserId = UserId };
                _context.UserProfiles.Add(profile);
            }
            _mapper.Map(userProfileDto, profile);

            await _context.SaveChangesAsync();
            return _mapper.Map<UserProfileDto>(profile);
        }

        public async Task<UserProfileDto> UpdateUserProfileAsync(
            string UserId,
            UserProfileDto userProfileDto
        )
        {
            var profile = await _context.UserProfiles.FindAsync(UserId);
            if (profile == null)
            {
                return null;
            }
            _mapper.Map(userProfileDto, profile);

            await _context.SaveChangesAsync();
            return _mapper.Map<UserProfileDto>(profile);
        }

        public async Task<UserProfileDto> DeleteUserProfileAsync(string UserId)
        {
            var profile = await _context.UserProfiles.FindAsync(UserId);
            if (profile == null)
            {
                return null;
            }
            _context.UserProfiles.Remove(profile);
            await _context.SaveChangesAsync();
            return _mapper.Map<UserProfileDto>(profile);
        }
    }
}
