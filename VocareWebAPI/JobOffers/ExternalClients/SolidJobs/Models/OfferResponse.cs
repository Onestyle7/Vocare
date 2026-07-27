using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models
{
   public sealed record OffersResponse
{
    public required IReadOnlyList<JobOffer> Jobs { get; init; }
    public required int PageIndex { get; init; }
    public required int PageSize { get; init; }
    public required int TotalCount { get; init; }
    public required int TotalPages { get; init; }
}

public sealed record JobOffer
{
    public required string JobOfferKey { get; init; }
    public required string Title { get; init; }
    public required Division Division { get; init; }
    public required JobCategory Category { get; init; }
    public required JobSubCategory SubCategory { get; init; }
    public required string Company { get; init; }
    public string? CompanyLogoUrl { get; init; }
    public required Salary Salary { get; init; }
    public Salary? SecondarySalary { get; init; }
    public required string ContractTime { get; init; }
    public required IReadOnlyList<string> Locations { get; init; }
    public required IReadOnlyList<string> Benefits { get; init; }
    public required bool IsRemote { get; init; }
    public required bool IsHybrid { get; init; }
    public required string Url { get; init; }
    public required ExperienceLevel ExperienceLevel { get; init; }
    public required IReadOnlyList<SkillTag> Skills { get; init; }
    public required IReadOnlyList<SkillTag> Languages { get; init; }
    public required string Description { get; init; }
    public required DateTimeOffset ValidFrom { get; init; }
    public required DateTimeOffset ValidTo { get; init; }
}

public sealed record Salary
{
    public decimal? From { get; init; }
    public decimal? To { get; init; }
    public required string Currency { get; init; }
    public required string Period { get; init; }
    public required string EmploymentType { get; init; }
}

public sealed record SkillTag
{
    public required SkillLevel Level { get; init; }
    public required string Name { get; init; }
}
}