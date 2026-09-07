namespace VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models
{
    public sealed record OfferQuery
    {
        /// <summary>Page index (0-based). Sent only when greater than 0.</summary>
    public int PageIndex { get; init; }

    /// <summary>Page size. Optional — when null the server uses its default (30, max 500).</summary>
    public int? PageSize { get; init; }

    public SortField? Sort { get; init; }
    public SortDirection Direction { get; init; } = SortDirection.Asc;

    /// <summary>City filter (e.g. "Warszawa", "Kraków").</summary>
    public IReadOnlyList<string> Cities { get; init; } = [];

    public IReadOnlyList<JobCategory> Categories { get; init; } = [];
    public IReadOnlyList<JobSubCategory> SubCategories { get; init; } = [];
    public IReadOnlyList<ExperienceLevel> Experiences { get; init; } = [];

    /// <summary>Full-text search phrases (title, company, required skills).</summary>
    public IReadOnlyList<string> SearchTerms { get; init; } = [];

    /// <summary>Minimum salary (offer's lower bound ≥ value).</summary>
    public int? MinimumSalary { get; init; }
    }
}