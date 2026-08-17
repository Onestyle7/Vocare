using System.Runtime.CompilerServices;
using VocareWebAPI.JobOffers.ExternalClients.SolidJobs;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Services.Interfaces;
using SolidJobsModels = VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class SolidJobsParser : IJobOfferProvider
    {
        public JobOfferSource Source { get; } = JobOfferSource.SolidJobs;
        private const string CampaignName = "vocare";
        private readonly SolidJobsClient _client;
        private readonly ILogger<SolidJobsParser> _logger;

        public SolidJobsParser(SolidJobsClient client, ILogger<SolidJobsParser> logger)
        {
            _client = client;
            _logger = logger;
        }

        public async IAsyncEnumerable<JobOffer> FetchOffersAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken = default
        )
        {
            foreach (var division in Enum.GetValues<SolidJobsModels.Division>())
            {
                var divisionOffers = new List<JobOffer>();
                try
                {
                    await foreach (
                        var offer in _client.GetAllOffersAsync(
                            division,
                            CampaignName,
                            null,
                            cancellationToken
                        )
                    )
                    {
                        divisionOffers.Add(MapToJobOffer(offer));
                    }
                    _logger.LogInformation(
                        "Fetched {Count} offers for division {Division}",
                        divisionOffers.Count,
                        division
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching offers for division {Division}", division);
                }
                foreach (var offer in divisionOffers)
                {
                    yield return offer;
                }
            }
        }

        private JobOffer MapToJobOffer(SolidJobsModels.JobOffer offer)
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
