using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Repositories.Interfaces;

namespace VocareWebAPI.UserManagement.Repositories.Implementations
{
    public class ProfileAttributesRepository : IProfileAttributesRepository
    {
        private readonly AppDbContext _dbContext;

        public ProfileAttributesRepository(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ProfileAttributes?> GetByUserIdAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
                return null;

            return await _dbContext.ProfileAttributes.FirstOrDefaultAsync(p => p.UserId == userId);
        }

        public async Task SaveAsync(ProfileAttributes attributes)
        {
            if (string.IsNullOrEmpty(attributes.UserId))
                throw new ArgumentException(
                    "UserId cannot be null or empty.",
                    nameof(attributes.UserId)
                );

            var existing = await _dbContext.ProfileAttributes.FirstOrDefaultAsync(p =>
                p.UserId == attributes.UserId
            );

            if (existing == null)
            {
                await _dbContext.ProfileAttributes.AddAsync(attributes);
            }
            else
            {
                existing.PracticalExperience = attributes.PracticalExperience;
                existing.HardCompetencies = attributes.HardCompetencies;
                existing.Creativity = attributes.Creativity;
                existing.Teamwork = attributes.Teamwork;
                existing.Independence = attributes.Independence;
                existing.SoftCompetencies = attributes.SoftCompetencies;
                existing.Certification = attributes.Certification;
                existing.TechnicalSkills = attributes.TechnicalSkills;
                existing.GeneratedAt = DateTime.UtcNow;

                _dbContext.ProfileAttributes.Update(existing);
            }
            await _dbContext.SaveChangesAsync();
        }
    }
}
