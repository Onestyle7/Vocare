using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.Shared.Extensions;
using SolidJobsModels = VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models;

namespace VocareWebAPI.JobOffers.ExternalClients.SolidJobs
{
    public static class SolidJobsMappingExtensions
    {
        public static JobOffer ToJobOfferEntity(this SolidJobsModels.JobOffer offer)
        {
            return new JobOffer
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = offer.JobOfferKey,
                Title = offer.Title,
                CompanyName = offer.Company,
                Url = offer.Url,
                Country = "Poland", // SolidJobs z tego co widziałem ma tylko polskie oferty, więc tymczasowo hardocded, semantycznie bardziej pasuje null, ale z perspektywy użytkownika brak danych będzie gorszy
                SeniorityLevel = offer.ExperienceLevel switch
                {
                    SolidJobsModels.ExperienceLevel.None => SeniorityLevel.Unknown,
                    SolidJobsModels.ExperienceLevel.Intern => SeniorityLevel.Trainee,
                    SolidJobsModels.ExperienceLevel.Junior => SeniorityLevel.Junior,
                    SolidJobsModels.ExperienceLevel.Regular => SeniorityLevel.Mid,
                    SolidJobsModels.ExperienceLevel.Senior => SeniorityLevel.Senior,
                    _ => SeniorityLevel.Unknown,
                },
                JobType = offer.ContractTime,
                Description = offer.Description,
                Category = MapCategory(offer.Category, offer.SubCategory),
                BriefDescription = "",
                // SolidJobs zwraca 0 zamiast braku kwoty (np. staże bez podanej stawki)
                SalaryMin = offer.Salary.From > 0 ? offer.Salary.From : null,
                SalaryMax = offer.Salary.To > 0 ? offer.Salary.To : null,
                SalaryCurrency = offer.Salary.Currency,
                SalaryPeriod = Enum.TryParse<SalaryPeriod>(
                    offer.Salary.Period,
                    true,
                    out var salaryPeriod
                )
                    ? salaryPeriod
                    : SalaryPeriod.Month,
                PublishedAt = offer.ValidFrom.UtcDateTime.TruncateToMicroseconds(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Locations = offer
                    .Locations.Select(location => new JobOfferLocation
                    {
                        Id = Guid.NewGuid(),
                        City = location,
                        IsRemote = offer.IsRemote,
                    })
                    .ToList(),
                Skills = offer
                    .Skills.Select(skill => new JobOfferSkill
                    {
                        Id = Guid.NewGuid(),
                        Name = skill.Name,
                        Level = skill.Level switch
                        {
                            SolidJobsModels.SkillLevel.NiceToHave => SkillLevel.NiceToHave,
                            SolidJobsModels.SkillLevel.Basic => SkillLevel.Regular,
                            SolidJobsModels.SkillLevel.Advanced => SkillLevel.Advanced,
                            SolidJobsModels.SkillLevel.Expert => SkillLevel.Expert,
                            _ => null,
                        },
                    })
                    .ToList(),
                Embedding = null,
                Source = JobOfferSource.SolidJobs,
            };
        }

        /// <summary>
        /// Mapuje kategorię SolidJobs na słownik kategorii NoFluffJobs, z którego AI wybiera AllowedJobCategories
        /// ścieżki kariery (OpenAIService). Bez tego filtr kategorii w matchingu odrzuca większość ofert SolidJobs.
        /// Synchronizujemy tylko dywizję IT, więc pozostałe kategorie trafiają do "other".
        /// </summary>
        public static string MapCategory(
            SolidJobsModels.JobCategory category,
            SolidJobsModels.JobSubCategory subCategory
        )
        {
            return category switch
            {
                SolidJobsModels.JobCategory.Developer => subCategory switch
                {
                    SolidJobsModels.JobSubCategory.JavaScript
                    or SolidJobsModels.JobSubCategory.Angular
                    or SolidJobsModels.JobSubCategory.React => "frontend",
                    SolidJobsModels.JobSubCategory.Android or SolidJobsModels.JobSubCategory.IOS =>
                        "mobile",
                    _ => "backend",
                },
                SolidJobsModels.JobCategory.Architect => "architecture",
                SolidJobsModels.JobCategory.Tester => "testing",
                SolidJobsModels.JobCategory.ItManager => subCategory switch
                {
                    SolidJobsModels.JobSubCategory.ProductManager
                    or SolidJobsModels.JobSubCategory.ProductOwner => "productManagement",
                    SolidJobsModels.JobSubCategory.ScrumMaster => "agile",
                    _ => "projectManager",
                },
                SolidJobsModels.JobCategory.DataScience => "data",
                SolidJobsModels.JobCategory.Security => "security",
                SolidJobsModels.JobCategory.Support => "support",
                SolidJobsModels.JobCategory.DevOps => "devops",
                SolidJobsModels.JobCategory.Analyst => "businessAnalyst",
                SolidJobsModels.JobCategory.Administrator => "sysAdministrator",
                SolidJobsModels.JobCategory.UXUIDesigner => "ux",
                SolidJobsModels.JobCategory.OtherIT => subCategory switch
                {
                    SolidJobsModels.JobSubCategory.ERP => "erp",
                    _ => "other",
                },
                _ => "other",
            };
        }
    }
}
