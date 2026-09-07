using System.Text.Json.Serialization;

namespace VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models
{
    public sealed record MarketStatisticsResponse
{
    /// <summary>Scope kind: <c>division</c>, <c>mainCategory</c>, <c>subcategory</c>, <c>subcategoryGroup</c> or <c>city</c>.</summary>
    public required string ScopeKind { get; init; }

    /// <summary>Scope key within the kind (e.g. <c>IT</c>, <c>React</c>, <c>warszawa</c>).</summary>
    public required string ScopeKey { get; init; }

    /// <summary>Moment the response was generated (UTC).</summary>
    public required DateTimeOffset GeneratedAt { get; init; }

    /// <summary>Section names actually present in this response (JSON tokens).</summary>
    public required IReadOnlyList<string> IncludedSections { get; init; }

    /// <summary>Demand and hiring metrics. Null when the section was not requested.</summary>
    public DemandStats? Demand { get; init; }

    /// <summary>Salary metrics (overall band plus precomputed B2B / permanent). Null when not requested.</summary>
    public SalaryStats? Salary { get; init; }

    /// <summary>Distribution of active offers by experience level. Null when not requested.</summary>
    public IReadOnlyList<Bucket>? Experience { get; init; }

    /// <summary>Most common cities by active offer count. Null when not requested or unavailable (city scope).</summary>
    public IReadOnlyList<Bucket>? TopLocations { get; init; }

    /// <summary>Most demanded skills by active offer count. Null when not requested.</summary>
    public IReadOnlyList<Bucket>? TopSkills { get; init; }
}

/// <summary>Demand and hiring metrics for the scope.</summary>
public sealed record DemandStats
{
    /// <summary>Number of active offers in the scope.</summary>
    public required int ActiveOffers { get; init; }

    /// <summary>Number of distinct employers publishing in the scope.</summary>
    public required int DistinctEmployers { get; init; }

    /// <summary>Number of fully remote offers.</summary>
    public required int RemoteOffers { get; init; }

    /// <summary>Share of fully remote offers (0–100).</summary>
    public required int RemotePercentage { get; init; }

    /// <summary>Quarterly offer-count trend (precomputed, up to 8 quarters).</summary>
    public required IReadOnlyList<TrendPoint> OfferTrend { get; init; }
}

/// <summary>A single quarterly trend point.</summary>
public sealed record TrendPoint
{
    /// <summary>Period label in <c>YYYY-Qn</c> format (e.g. <c>2026-Q1</c>).</summary>
    public required string Period { get; init; }

    /// <summary>Offer count for the quarter.</summary>
    public required int OfferCount { get; init; }
}

/// <summary>Salary metrics for the scope. Monthly amounts in PLN.</summary>
public sealed record SalaryStats
{
    /// <summary>Currency of every amount (constant: PLN).</summary>
    public required string Currency { get; init; }

    /// <summary>Overall band computed live from active offers (percentiles). Null when no offers declare a salary.</summary>
    public SalaryBand? Overall { get; init; }

    /// <summary>Precomputed B2B salary stat. Null when no data.</summary>
    [JsonPropertyName("b2b")]
    public SalaryStat? B2B { get; init; }

    /// <summary>Precomputed permanent-contract (UoP) salary stat. Null when no data.</summary>
    public SalaryStat? Permanent { get; init; }
}

/// <summary>Salary band computed live from active offers.</summary>
public sealed record SalaryBand
{
    /// <summary>Minimum (lower edge of the range).</summary>
    public required decimal Min { get; init; }

    /// <summary>25th percentile.</summary>
    public required decimal P25 { get; init; }

    /// <summary>Median (50th percentile).</summary>
    public required decimal Median { get; init; }

    /// <summary>75th percentile.</summary>
    public required decimal P75 { get; init; }

    /// <summary>Maximum (upper edge of the range).</summary>
    public required decimal Max { get; init; }
}

/// <summary>Precomputed salary stat per contract type.</summary>
public sealed record SalaryStat
{
    /// <summary>Median salary.</summary>
    public required decimal Median { get; init; }

    /// <summary>Average salary.</summary>
    public required decimal Average { get; init; }

    /// <summary>Number of offers behind the stat.</summary>
    public required int OfferCount { get; init; }
}

/// <summary>Distribution entry: label + offer count + share.</summary>
public sealed record Bucket
{
    /// <summary>Entry label (experience level / city / skill name).</summary>
    public required string Label { get; init; }

    /// <summary>Offer count in the entry.</summary>
    public required int OfferCount { get; init; }

    /// <summary>Share against all active offers of the scope (0–100).</summary>
    public required int Percentage { get; init; }
}
}