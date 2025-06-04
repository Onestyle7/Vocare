using System.Text.Json;
using Microsoft.Extensions.Options;
using Stripe;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Models.Config;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Models.Entities;

namespace VocareWebAPI.CvGenerator.Services.Implementations
{
    /// <summary>
    /// Serwis odpowiedzialny za generowanie CV na podstawie danych użytkownika i API Perplexity.
    /// </summary>
    public class CvGenerationService : ICvGenerationService
    {
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IGeneratedCvRepository _generatedCvRepository;
        private readonly ILogger<CvGenerationService> _logger;

        public CvGenerationService(
            IUserProfileRepository userProfileRepository,
            IGeneratedCvRepository generatedCvRepository,
            ILogger<CvGenerationService> logger
        )
        {
            _userProfileRepository = userProfileRepository;
            _generatedCvRepository = generatedCvRepository;
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
                    throw new Exception($"User profile not found for userId: {userId}");
                }

                var cvDto = MapUserProfileToCv(userProfile, position);

                // Zapisujemy wygenerowane CV do bazy danych
                await SaveGeneratedCvAsync(userId, position, cvDto);
                _logger.LogInformation($"Cv generation completed successfully for user: {userId}");
                return cvDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating CV for user {UserId}", userId);
                throw new Exception("An error occurred while generating the CV.");
            }
        }

        private CvDto MapUserProfileToCv(UserProfile userProfile, string? position)
        {
            // ✅ Debug - sprawdź co jest załadowane
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
                Summary = GenerateSummary(profile, position),
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

        private string GenerateSummary(UserProfile profile, string? position)
        {
            // Podstawowe podsumowanie na podstawie danych profilu
            var summaryParts = new List<string>();

            if (!string.IsNullOrEmpty(profile.AboutMe))
            {
                summaryParts.Add(profile.AboutMe);
            }

            // Dodaj informacje o doświadczeniu zawodowym
            if (profile.WorkExperience?.Any() == true)
            {
                var yearsOfExperience = CalculateYearsOfExperience(profile.WorkExperience);
                if (yearsOfExperience > 0)
                {
                    var experienceText =
                        yearsOfExperience == 1
                            ? "rok doświadczenia zawodowego"
                            : $"{yearsOfExperience} lat doświadczenia zawodowego";

                    summaryParts.Add($"Posiadam {experienceText}.");
                }
            }

            // Dodaj informacje o wykształceniu
            if (profile.Education?.Any() == true)
            {
                var highestEducation = profile
                    .Education.OrderByDescending(e => e.EndDate ?? DateTime.MaxValue)
                    .FirstOrDefault();

                if (highestEducation != null)
                {
                    summaryParts.Add(
                        $"Wykształcenie: {highestEducation.Degree} w dziedzinie {highestEducation.Field}."
                    );
                }
            }

            // Dodaj informacje o stanowisku, jeśli zostało podane
            if (!string.IsNullOrEmpty(position))
            {
                summaryParts.Add($"Zainteresowany stanowiskiem: {position}.");
            }

            return summaryParts.Any()
                ? string.Join(" ", summaryParts)
                : "Profesjonalista poszukujący nowych wyzwań zawodowych.";
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

        private async Task SaveGeneratedCvAsync(string userId, string? position, CvDto cvDto)
        {
            try
            {
                var cvJson = JsonSerializer.Serialize(
                    cvDto,
                    new JsonSerializerOptions
                    {
                        WriteIndented = false,
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    }
                );
                var generatedCv = new GeneratedCv
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Position = position,
                    CvJson = cvJson,
                    RawApiResponse = "Generated by mapping service", //Placeholder dla kompatybilności
                    GeneratedAt = DateTime.UtcNow,
                };
                await _generatedCvRepository.AddAsync(generatedCv);
                _logger.LogInformation("Cv saved to database for user: {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving generated CV for user {UserId}", userId);
            }
        }
    }
}
