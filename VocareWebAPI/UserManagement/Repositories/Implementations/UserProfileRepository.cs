using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Exceptions;

namespace VocareWebAPI.Repositories
{
    /// <summary>
    /// Repozytorium odpowiedzialne za operacje na profilach użytkowników w bazie danych
    /// </summary>
    public class UserProfileRepository : IUserProfileRepository
    {
        private readonly AppDbContext _context;

        /// <summary>
        /// Inicjalizuje nowa instancję repozytorium profili użytkowników
        /// </summary>
        /// <param name="context">Kontekst bazy danych aplikacji</param>
        public UserProfileRepository(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Pobiera profil użytkownika na podstawie jego identyfikatora
        /// </summary>
        /// <param name="userId">Id użytkownika</param>
        /// <returns>Profil użytkownika lub null, jesli nie znaleziono</returns>
        public async Task<UserProfile> GetUserProfileByIdAsync(string userId)
        {
            var profile = await _context
                .UserProfiles.AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.WorkExperience)
                .Include(p => p.Education)
                .Include(p => p.Certificates)
                .Include(p => p.Languages)
                .Include(p => p.FinancialSurvey)
                .FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null)
                throw new UserProfileNotFoundException(userId);

            return profile;
        }

        /// <summary>
        /// Aktualizuje profil użytkownika w bazie danych
        /// </summary>
        /// <param name="profile">Profil użytkownika do zaktualizowania</param>
        /// <returns>Task reprezentujący operacje async</returns>
        public async Task UpdateUserProfileAsync(UserProfile profile)
        {
            _context.Entry(profile).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task<UserProfile> GetTrackedProfileWithCollectionsAsync(string userId)
        {
            var profile = await _context
                .UserProfiles.Include(p => p.Education)
                .Include(p => p.WorkExperience)
                .Include(p => p.Certificates)
                .Include(p => p.Languages)
                .Include(p => p.FinancialSurvey)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
                throw new UserProfileNotFoundException(userId);

            return profile;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
