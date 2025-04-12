using AutoMapper;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Services
{
    /// <summary>
    /// Serwis odpowiedzialny za zarządzanie profilami użytkowników
    /// </summary>
    public class UserProfileService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        /// <summary>
        /// Inicjalizuje nową instację serwisu UserProfileService
        /// </summary>
        /// <param name="context">Kontekst bazy danych aplikacji</param>
        /// <param name="mapper">Mapper do mapowania obiektów</param>
        public UserProfileService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        /// <summary>
        /// Pobiera profil użytkownika na podstawie jego id
        /// </summary>
        /// <param name="UserId">id uzytkownika</param>
        /// <returns>Profil użytkowniak w formacie dto lub null, jesli nie znaleziono</returns>
        public async Task<UserProfileDto> GetUserProfileAsync(string UserId)
        {
            var profile = await _context.UserProfiles.FirstOrDefaultAsync(u => u.UserId == UserId);
            if (profile == null)
            {
                return null;
            }
            return _mapper.Map<UserProfileDto>(profile);
        }

        /// <summary>
        /// Tworzy
        /// </summary>
        /// <param name="UserId"></param>
        /// <param name="userProfileDto"></param>
        /// <returns></returns>
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

        /// <summary>
        /// Aktaulizuje profil użytkownika na podstaie jego id
        /// </summary>
        /// <param name="UserId">id uzytkownika</param>
        /// <param name="userProfileDto">Zaktualizowane dane profilu użytkownika w formacie DTO.</param>
        /// <returns>Zaktualizowany profil użytkownika w formacie DTO lub null, jeśli nie znaleziono.</returns>
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

        /// <summary>
        /// Usuwa profil użytkownika na podstawie jego identyfikatora
        /// </summary>
        /// <param name="UserId">id uzytkownika</param>
        /// <returns>Usunięty profil użytkownika w formacie DTO lub null, jeśli nie znaleziono</returns>
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
