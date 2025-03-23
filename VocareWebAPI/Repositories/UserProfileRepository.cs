using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Repositories
{
    public class UserProfileRepository : IUserProfileRepository
    {
        private readonly AppDbContext _context;

        public UserProfileRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserProfile> GetUserProfileByIdAsync(string userId)
        {
            return await _context.UserProfiles.FirstOrDefaultAsync(u => u.UserId == userId);
        }

        public async Task UpdateUserProfileAsync(UserProfile profile)
        {
            _context.Entry(profile).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }
    }
}
