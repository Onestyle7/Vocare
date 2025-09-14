using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
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
            try
            {
                _logger.LogInformation(
                    $"Starting CV generation for user: {userId}, position: {position}"
                );

                var userProfile = await _userProfileRepository.GetUserProfileByIdAsync(userId);
                if (userProfile == null)
                {
                    // Używamy KeyNotFoundException zamiast Exception - to nie będzie łapane przez catch
                    throw new KeyNotFoundException($"User profile not found for userId: {userId}");
                }

                var cvDto = MapUserProfileToCv(userProfile, position);
                _logger.LogInformation($"Cv generation completed successfully for user: {userId}");
                return cvDto;
            }
            catch (KeyNotFoundException)
            {
                // Przepuszczamy KeyNotFoundException bez opakowywania
                throw;
            }
            catch (ArgumentException)
            {
                // Przepuszczamy ArgumentException bez opakowywania
                throw;
            }
            catch (Exception ex)
            {
                // Tylko nieznane błędy opakowujemy w generyczną wiadomość
                _logger.LogError(ex, "Error generating CV for user {UserId}", userId);
                throw new Exception("An error occurred while generating the CV.");
            }
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
                        Description = BuildWorkDescription(work),
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

        private string BuildWorkDescription(WorkExperienceEntry work)
        {
            var descriptionParts = new List<string>();

            if (!string.IsNullOrEmpty(work.Description))
            {
                descriptionParts.Add(work.Description);
            }
            if (work.Responsibilities?.Any() == true)
            {
                var responsibilitesText =
                    "Główne obowiązki: " + string.Join(", ", work.Responsibilities);
                descriptionParts.Add(responsibilitesText);
            }
            return descriptionParts.Any()
                ? string.Join(" ", descriptionParts)
                : $"Praca na stanowisku {work.Position} w firmie {work.Company}.";
        }

        private int CalculateYearsOfExperience(List<WorkExperienceEntry> workExperience)
        {
            if (workExperience?.Any() != true)
            {
                return 0;
            }
            var totalMonths = 0;
            foreach (var work in workExperience.Where(w => w.StartDate.HasValue))
            {
                var startDate = work.StartDate!.Value;
                var endDate = work.EndDate ?? DateTime.Now;

                var months =
                    ((endDate.Year - startDate.Year) * 12) + endDate.Month - startDate.Month;
                totalMonths += Math.Max(0, months);
            }
            return totalMonths / 12;
        }

        private string? FormatDate(DateTime? date)
        {
            return date?.ToString("yyyy-MM-dd");
        }
    }
}
