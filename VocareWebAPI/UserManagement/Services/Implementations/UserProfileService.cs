using AutoMapper;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.UserManagement.Exceptions;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Models.Enums;

namespace VocareWebAPI.Services
{
    /// <summary>
    /// Serwis odpowiedzialny za zarządzanie profilami użytkowników
    /// </summary>
    public class UserProfileService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<UserProfileService> _logger;
        private readonly IUserProfileRepository _userProfileRepository;

        /// <summary>
        /// Inicjalizuje nową instację serwisu UserProfileService
        /// </summary>
        /// <param name="context">Kontekst bazy danych aplikacji</param>
        /// <param name="mapper">Mapper do mapowania obiektów</param>
        public UserProfileService(
            AppDbContext context,
            IMapper mapper,
            ILogger<UserProfileService> logger,
            IUserProfileRepository userProfileRepository
        )
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _userProfileRepository = userProfileRepository;
        }

        /// <summary>
        /// Pobiera profil użytkownika na podstawie jego id
        /// </summary>
        /// <param name="UserId">id uzytkownika</param>
        /// <returns>Profil użytkowniak w formacie dto lub null, jesli nie znaleziono</returns>
        public async Task<UserProfileDto> GetUserProfileAsync(string UserId)
        {
            _logger.LogInformation("Fetching profile for UserId: {UserId}", UserId);

            var profile = await _userProfileRepository.GetUserProfileByIdAsync(UserId);

            _logger.LogInformation("Profile found for UserId: {UserId}", UserId);

            var dto = _mapper.Map<UserProfileDto>(profile);

            if (dto.WorkExperience != null)
            {
                foreach (var work in dto.WorkExperience)
                {
                    if (
                        (work.Responsibilities is null || work.Responsibilities.Count == 0)
                        && !string.IsNullOrWhiteSpace(work.Description)
                    )
                    {
                        work.Responsibilities = new List<string> { work.Description };
                    }
                }
            }
            return dto;
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
            _logger.LogInformation("Creating profile for UserId: {UserId}", UserId);

            var profile = await _context
                .UserProfiles.Include(u => u.Education)
                .Include(u => u.WorkExperience)
                .Include(u => u.Certificates)
                .Include(u => u.Languages)
                .Include(u => u.FinancialSurvey)
                .FirstOrDefaultAsync(u => u.UserId == UserId);

            if (profile == null)
            {
                _logger.LogInformation(
                    "Profile not found, creating new for UserId: {UserId}",
                    UserId
                );
                profile = new UserProfile { UserId = UserId };
                _context.UserProfiles.Add(profile);
            }
            else
            {
                _logger.LogInformation("Profile already exists for UserId: {UserId}", UserId);

                profile.Education.Clear();
                profile.WorkExperience.Clear();
                profile.Certificates.Clear();
                profile.Languages.Clear();
            }

            // Zachowujemy istniejącą ankietę finansową, aby uniknąć duplikacji
            var existingSurvey = profile.FinancialSurvey;

            // Mapowanie danych podstawowych
            _mapper.Map(userProfileDto, profile);

            if (userProfileDto.FinancialSurvey != null)
            {
                if (existingSurvey == null)
                {
                    existingSurvey = new FinancialSurvey { UserId = profile.UserId };
                    _context.FinancialSurveys.Add(existingSurvey);
                }

                _mapper.Map(userProfileDto.FinancialSurvey, existingSurvey);
                existingSurvey.UserId = profile.UserId;
                profile.FinancialSurvey = existingSurvey;
            }

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Profile saved successfully for UserId: {UserId}", UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving profile for UserId: {UserId}", UserId);
                throw;
            }

            var result = _mapper.Map<UserProfileDto>(profile);
            _logger.LogInformation("Profile mapped to DTO for UserId: {UserId}", UserId);
            return result;
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
            var profile = await _context
                .UserProfiles.Include(u => u.Education)
                .Include(u => u.WorkExperience)
                .Include(u => u.Certificates)
                .Include(u => u.Languages)
                .Include(u => u.FinancialSurvey)
                .FirstOrDefaultAsync(u => u.UserId == UserId);

            if (profile == null)
                throw new UserProfileNotFoundException(UserId);

            // Czyszczenie kolekcji
            profile.Education.Clear();
            profile.WorkExperience.Clear();
            profile.Certificates.Clear();
            profile.Languages.Clear();

            // Zachowujemy istniejącą ankietę finansową, aby uniknąć duplikacji
            var existingSurvey = profile.FinancialSurvey;

            // Mapowanie danych podstawowych
            _mapper.Map(userProfileDto, profile);

            if (userProfileDto.FinancialSurvey != null)
            {
                if (existingSurvey == null)
                {
                    existingSurvey = new FinancialSurvey { UserId = profile.UserId };
                    _context.FinancialSurveys.Add(existingSurvey);
                }

                _mapper.Map(userProfileDto.FinancialSurvey, existingSurvey);
                existingSurvey.UserId = profile.UserId;
                profile.FinancialSurvey = existingSurvey;
            }

            // Logowanie wartości DateTime dla debugowania
            foreach (var education in profile.Education)
            {
                _logger.LogInformation(
                    "Education: StartDate={StartDate}, EndDate={EndDate}, Kind(StartDate)={KindStart}, Kind(EndDate)={KindEnd}",
                    education.StartDate,
                    education.EndDate,
                    education.StartDate?.Kind,
                    education.EndDate?.Kind
                );
            }
            foreach (var work in profile.WorkExperience)
            {
                _logger.LogInformation(
                    "WorkExperience: StartDate={StartDate}, EndDate={EndDate}, Kind(StartDate)={KindStart}, Kind(EndDate)={KindEnd}",
                    work.StartDate,
                    work.EndDate,
                    work.StartDate?.Kind,
                    work.EndDate?.Kind
                );
            }
            foreach (var certificate in profile.Certificates)
            {
                _logger.LogInformation(
                    "Certificate: Date={Date}, Kind(Date)={Kind}",
                    certificate.Date,
                    certificate.Date?.Kind
                );
            }

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
            var profile = await _context.UserProfiles.FirstOrDefaultAsync(u => u.UserId == UserId);

            if (profile == null)
                throw new UserProfileNotFoundException(UserId);

            _logger.LogInformation("Removing UserProfile for UserId {UserId}", UserId);
            _context.UserProfiles.Remove(profile);

            await _context.SaveChangesAsync();
            return _mapper.Map<UserProfileDto>(profile);
        }

        /// <summary>
        /// Czyści dane profilu użytkownika (zeruje pola i wpisy CV)
        /// ZACHOWUJE sam profil
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        public async Task ClearUserProfileAsync(string userId)
        {
            var profile = await _userProfileRepository.GetTrackedProfileWithCollectionsAsync(
                userId
            );

            profile.FirstName = string.Empty;
            profile.LastName = string.Empty;
            profile.Country = string.Empty;
            profile.Address = null;
            profile.PhoneNumber = null;
            profile.AboutMe = null;
            profile.AdditionalInformation = null;
            profile.WillingToRebrand = false;
            profile.PersonalityType = PersonalityType.Unknown;

            profile.Skills = new();
            profile.SoftSkills = new();

            profile.Education.Clear();
            profile.WorkExperience.Clear();
            profile.Certificates.Clear();
            profile.Languages.Clear();

            if (profile.FinancialSurvey != null)
            {
                profile.FinancialSurvey.CurrentSalary = null;
                profile.FinancialSurvey.DesiredSalary = null;
                profile.FinancialSurvey.HasLoans = false;
                profile.FinancialSurvey.LoanDetails = null;
                profile.FinancialSurvey.RiskAppetite = Risk.Unknown;
                profile.FinancialSurvey.WillingToRelocate = false;
            }

            await _userProfileRepository.SaveChangesAsync();

            _logger.LogInformation("Cleared profile data for UserId: {UserId}", userId);
        }
    }
}
