using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
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
                Category = offer.Category.ToString(),
                BriefDescription = "",
                SalaryMin = offer.Salary.From,
                SalaryMax = offer.Salary.To,
                SalaryCurrency = offer.Salary.Currency,
                SalaryPeriod = Enum.TryParse<SalaryPeriod>(
                    offer.Salary.Period,
                    out var salaryPeriod
                )
                    ? salaryPeriod
                    : SalaryPeriod.Month,
                PublishedAt = offer.ValidFrom.UtcDateTime,
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
                    })
                    .ToList(),
                Embedding = null,
                Source = JobOfferSource.SolidJobs,
            };
        }
    }
}
