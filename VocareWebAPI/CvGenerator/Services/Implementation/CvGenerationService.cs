using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.UserManagement.Exceptions;
using VocareWebAPI.UserManagement.Models.Entities;

namespace VocareWebAPI.CvGenerator.Services.Implementations
{
    /// <summary>
    /// Serwis odpowiedzialny za generowanie CV na podstawie danych użytkownika i API Perplexity.
    /// </summary>
    public class CvGenerationService : ICvGenerationService
    {
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly ILogger<CvGenerationService> _logger;

        public CvGenerationService(
            IUserProfileRepository userProfileRepository,
            ILogger<CvGenerationService> logger
        )
        {
            _userProfileRepository = userProfileRepository;
            _logger = logger;
        }

        public async Task<CvDto> GenerateCvAsync(string userId, string? position)
        {
            _logger.LogInformation(
                $"Starting CV generation for user: {userId}, position: {position}"
            );

            var userProfile = await _userProfileRepository.GetUserProfileByIdAsync(userId);
            if (userProfile == null)
                throw new UserProfileNotFoundException(userId);

            var cvDto = MapUserProfileToCv(userProfile, position);
            _logger.LogInformation($"Cv generation completed successfully for user: {userId}");
            return cvDto;
        }

        private CvDto MapUserProfileToCv(UserProfile userProfile, string? position)
        {
            _logger.LogInformation("Mapping CV for user: {UserId}", userProfile.UserId);
            _logger.LogInformation(
                "WorkExperience count: {Count}",
                userProfile.WorkExperience?.Count ?? 0
            );
            _logger.LogInformation("Education count: {Count}", userProfile.Education?.Count ?? 0);
            _logger.LogInformation(
                "Certificates count: {Count}",
                userProfile.Certificates?.Count ?? 0
            );
            _logger.LogInformation("Languages count: {Count}", userProfile.Languages?.Count ?? 0);
            _logger.LogInformation("Skills count: {Count}", userProfile.Skills?.Count ?? 0);

            var cv = new CvDto
            {
                Basics = MapBasics(userProfile, position),
                Work = MapWorkExperience(userProfile.WorkExperience),
                Education = MapEducation(userProfile.Education),
                Certificates = MapCertificates(userProfile.Certificates),
                Skills = userProfile.Skills ?? new List<string>(),
                Languages = MapLanguages(userProfile.Languages),
                Hobbies = new List<string>(),
            };
            return cv;
        }

        private CvBasicsDto MapBasics(UserProfile profile, string? position)
        {
            return new CvBasicsDto
            {
                FirstName = profile.FirstName,
                LastName = profile.LastName,
                PhoneNumber = profile.PhoneNumber ?? string.Empty,
                Email = profile.User?.Email ?? $"user-{profile.FirstName}@gmail.com",
                Location = new CvLocationDto
                {
                    City = profile.Address ?? string.Empty,
                    Country = profile.Country,
                },
                Summary = profile.AboutMe ?? string.Empty,
            };
        }

        private List<CvWorkEntryDto> MapWorkExperience(List<WorkExperienceEntry>? workExperience)
        {
            return workExperience
                    ?.Select(work => new CvWorkEntryDto
                    {
                        Company = work.Company,
                        Position = work.Position,
                        StartDate = FormatDate(work.StartDate),
                        EndDate = FormatDate(work.EndDate) ?? "Present",
                        Responsibilities = work.Responsibilities?.Any() == true ? work.Responsibilities.ToList()
                        : !string.IsNullOrWhiteSpace(work.Description)
                        ? new List<string> { work.Description }
                        : new List<string>(),
                    })
                    .ToList() ?? new List<CvWorkEntryDto>();
        }

        private List<CvEducationEntryDto> MapEducation(List<EducationEntry>? education)
        {
            return education
                    ?.Select(edu => new CvEducationEntryDto
                    {
                        Institution = edu.Institution,
                        Degree = edu.Degree,
                        Field = edu.Field,
                        StartDate = FormatDate(edu.StartDate),
                        EndDate = FormatDate(edu.EndDate) ?? "Present",
                    })
                    .ToList() ?? new List<CvEducationEntryDto>();
        }

        private List<CvCertificateEntryDto> MapCertificates(List<CertificateEntry>? certificates)
        {
            return certificates
                    ?.Select(cert => new CvCertificateEntryDto
                    {
                        Name = cert.Name,
                        Date = FormatDate(cert.Date) ?? string.Empty,
                    })
                    .ToList() ?? new List<CvCertificateEntryDto>();
        }

        private List<string> MapSkills(List<string>? skills)
        {
            return skills ?? new List<string>();
        }

        private List<CvLanguageEntryDto> MapLanguages(List<LanguageEntry>? languages)
        {
            return languages
                    ?.Select(lang => new CvLanguageEntryDto
                    {
                        Language = lang.Language,
                        Fluency = lang.Level,
                    })
                    .ToList() ?? new List<CvLanguageEntryDto>();
        }

        private string? FormatDate(DateTime? date)
        {
            return date?.ToString("yyyy-MM-dd");
        }
    }
}
