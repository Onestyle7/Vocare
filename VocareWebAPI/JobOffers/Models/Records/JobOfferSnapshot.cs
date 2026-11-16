using VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models;
using VocareWebAPI.JobOffers.Models.Enums;

namespace VocareWebAPI.JobOffers.Models.Records
{
    public record JobOfferSnapshot(
        Guid Id,
        string ReferenceNumber,
        JobOfferSource Source,
        string Title,
        string? CompanyName,
        string? Url,
        string? Country,
        string? Category,
        SeniorityLevel SeniorityLevel,
        string? JobType,
        string? Description,
        string? BriefDescription,
        decimal? SalaryMin,
        decimal? SalaryMax,
        string? SalaryCurrency,
        SalaryPeriod? SalaryPeriod,
        DateTime PublishedAt,
        bool HasEmbedding,
        bool IsActive,
        DateTime? DeactivatedAt
    );
}
