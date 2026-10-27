using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.Shared.Extensions;
using SjCategory = VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models.JobCategory;
using SjSubCategory = VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models.JobSubCategory;
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
        /// Kategorie spoza IT są przypisane tak, jak NoFluffJobs przypisuje podobne stanowiska.
        /// </summary>
        public static string MapCategory(SjCategory category, SjSubCategory subCategory)
        {
            return category switch
            {
                // IT
                SjCategory.Developer => subCategory switch
                {
                    SjSubCategory.JavaScript or SjSubCategory.Angular or SjSubCategory.React =>
                        "frontend",
                    SjSubCategory.Android or SjSubCategory.IOS => "mobile",
                    // NoFluffJobs też trzyma stanowiska C/C++ w "embedded"
                    SjSubCategory.CCPlusPlus => "embedded",
                    _ => "backend",
                },
                SjCategory.Architect => "architecture",
                SjCategory.Tester => "testing",
                SjCategory.ItManager => subCategory switch
                {
                    SjSubCategory.ProductManager or SjSubCategory.ProductOwner =>
                        "productManagement",
                    SjSubCategory.ScrumMaster => "agile",
                    _ => "projectManager",
                },
                SjCategory.DataScience => "data",
                SjCategory.Security => "security",
                SjCategory.Support => "support",
                SjCategory.DevOps => "devops",
                SjCategory.Analyst => "businessAnalyst",
                SjCategory.Administrator => "sysAdministrator",
                SjCategory.UXUIDesigner => "ux",
                SjCategory.OtherIT => subCategory == SjSubCategory.ERP ? "erp" : "other",

                // Engineering
                SjCategory.AutomationAndRobotics => "automation",
                SjCategory.ElectronicsAndTelecommunication => "electronics",
                // Kontrola jakości - ścieżki w stylu "kontrola jakości" AI opisuje kategorią "testing"
                SjCategory.QualityEngineering => "testing",
                SjCategory.Mechatronics
                or SjCategory.TechnologicalEngineering
                or SjCategory.ProductionEngineering
                or SjCategory.ConstructionAndDesign
                or SjCategory.MaintenanceEngineering => "mechanics",

                // Marketing
                SjCategory.Marketing
                or SjCategory.Copywriter
                or SjCategory.SocialMediaSpecialist
                or SjCategory.SEO
                or SjCategory.EmployerBrandingSpecialist
                or SjCategory.MediaAndJournalism
                or SjCategory.OtherMarketing => "marketing",

                // Sales (API zwraca ECommerce w dywizji Sales)
                SjCategory.CustomerSuccess => "customerService",
                SjCategory.B2BSales
                or SjCategory.B2CSales
                or SjCategory.AccountManager
                or SjCategory.ECommerce
                or SjCategory.OtherSales => "sales",

                // HR
                SjCategory.Recruiter
                or SjCategory.HRSpecialist
                or SjCategory.GrowthAndCourses
                or SjCategory.OtherHr => "hr",

                // Logistics
                SjCategory.SupplyChain
                or SjCategory.Transport
                or SjCategory.PurchasesAndSupplies
                or SjCategory.ProductionPlanning
                or SjCategory.OtherLogistics => "logistics",

                // Finances
                SjCategory.Accounting
                or SjCategory.AnalyticsAndControlling
                or SjCategory.AccountingConsulting
                or SjCategory.AuditsAndCompliance
                or SjCategory.Insurance
                or SjCategory.OtherFinances => "finance",

                // Other
                SjCategory.LawAndAdministration => "law",
                SjCategory.OtherOther => subCategory switch
                {
                    SjSubCategory.Backoffice => "officeAdministration",
                    SjSubCategory.GraphicDesigner => "marketing",
                    _ => "other",
                },

                // Management, ResearchAndDevelopment, OtherEngineering i nowe kategorie, których jeszcze nie znamy
                _ => "other",
            };
        }
    }
}
