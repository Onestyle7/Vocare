using System.Globalization;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;
using Microsoft.Extensions.Options;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Models.Options;
using VocareWebAPI.JobOffers.Services.Interfaces;
using VocareWebAPI.Shared.Extensions;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class NoFluffJobsParser : IJobOfferProvider
    {
        public JobOfferSource Source { get; } = JobOfferSource.NofluffJobs;
        private readonly HttpClient _httpClient;
        private readonly ILogger<NoFluffJobsParser> _logger;
        private readonly NofluffJobsFetchOptions _nofluffJobsUrl;

        public NoFluffJobsParser(
            HttpClient httpClient,
            ILogger<NoFluffJobsParser> logger,
            IOptions<NofluffJobsFetchOptions> nofluffJobsFetchOptions
        )
        {
            _httpClient = httpClient;
            _logger = logger;
            _nofluffJobsUrl = nofluffJobsFetchOptions.Value;
        }

        public async IAsyncEnumerable<JobOffer> FetchOffersAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken = default
        )
        {
            var tempPath = Path.GetTempFileName();
            try
            {
                await using (
                    var httpStream = await _httpClient.GetStreamAsync(
                        _nofluffJobsUrl.NoFluffJobsfeed,
                        cancellationToken
                    )
                )
                await using (var fileStream = File.Create(tempPath))
                {
                    await httpStream.CopyToAsync(fileStream, cancellationToken);
                }
                await using var localStream = File.OpenRead(tempPath);
                using var reader = XmlReader.Create(
                    localStream,
                    new XmlReaderSettings { Async = true }
                );
                while (await reader.ReadAsync())
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    if (reader.NodeType == XmlNodeType.Element && reader.Name == "job")
                    {
                        using var subtreeReader = reader.ReadSubtree();

                        var jobElement = await XElement.LoadAsync(
                            subtreeReader,
                            LoadOptions.None,
                            cancellationToken
                        );

                        JobOffer? offer = null;
                        var referenceNumber = jobElement.Element("referencenumber")?.Value;

                        try
                        {
                            offer = new JobOffer
                            {
                                Id = Guid.NewGuid(),
                                ReferenceNumber =
                                    jobElement.Element("referencenumber")?.Value ?? "",
                                Title = jobElement.Element("title")?.Value ?? "",
                                CompanyName = jobElement.Element("company")?.Value ?? "",
                                Url = jobElement.Element("url")?.Value ?? "",
                                Country = jobElement.Element("country")?.Value,
                                Category = jobElement.Element("category")?.Value ?? "",
                                JobType = jobElement.Element("jobtype")?.Value ?? "",
                                Description = jobElement.Element("description")?.Value ?? "",
                                BriefDescription =
                                    jobElement.Element("brief_job_description")?.Value ?? "",
                                PublishedAt = ParseDate(jobElement.Element("date")?.Value)
                                    .TruncateToMicroseconds(),
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow,
                                SeniorityLevel = ParseSeniority(
                                    jobElement.Element("seniority")?.Value
                                ),
                            };
                            var salary = ParseSalary(jobElement.Element("salary")?.Value);
                            offer.SalaryMin = salary.Min;
                            offer.SalaryMax = salary.Max;
                            offer.SalaryCurrency = salary.Currency;
                            offer.SalaryPeriod = salary.Period;
                            offer.Locations = ParseLocations(
                                jobElement.Element("city")?.Value,
                                offer.Id
                            );
                            offer.Skills = ParseSkills(
                                jobElement.Element("description")?.Value,
                                offer.Id
                            );
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(
                                ex,
                                "Nie udało się sparsować oferty pracy {ReferenceNumber} z NoFluffJobs",
                                referenceNumber
                            );
                        }

                        if (offer is not null)
                            yield return offer;
                    }
                }
            }
            finally
            {
                if (File.Exists(tempPath))
                    File.Delete(tempPath);
            }
        }

        private SeniorityLevel ParseSeniority(string? seniorityText)
        {
            if (string.IsNullOrWhiteSpace(seniorityText))
                return SeniorityLevel.Unknown;

            return seniorityText.ToLower().Trim() switch
            {
                "trainee" => SeniorityLevel.Trainee,
                "junior" => SeniorityLevel.Junior,
                "mid" => SeniorityLevel.Mid,
                "senior" => SeniorityLevel.Senior,
                "expert" => SeniorityLevel.Expert,
                "lead" => SeniorityLevel.Expert, // Lead traktujemy jak Expert
                _ => SeniorityLevel.Unknown, //  default
            };
        }

        private DateTime ParseDate(string? dateText)
        {
            if (string.IsNullOrWhiteSpace(dateText))
                return DateTime.UtcNow;

            var normalized = dateText.Replace("CET", "+01:00").Replace("CEST", "+02:00");

            if (
                DateTimeOffset.TryParseExact(
                    normalized,
                    "ddd, dd MMM yyyy HH:mm:ss zzz",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var dto
                )
            )
            {
                return dto.UtcDateTime;
            }
            if (
                DateTimeOffset.TryParse(
                    normalized,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var dtoFallback
                )
            )
            {
                return dtoFallback.UtcDateTime;
            }
            _logger.LogDebug("Nie udało się sparsować daty: {DateText}", dateText);
            return DateTime.UtcNow;
        }

        private (decimal? Min, decimal? Max, string? Currency, SalaryPeriod? Period) ParseSalary(
            string? salaryText
        )
        {
            if (string.IsNullOrWhiteSpace(salaryText))
                return (null, null, null, null);

            try
            {
                // Wyciągamy liczby z tekstu
                var numbers = Regex
                    .Matches(salaryText, @"\d+")
                    .Select(m => decimal.Parse(m.Value))
                    .ToList();

                decimal? min = numbers.Count > 0 ? numbers[0] : null;
                decimal? max = numbers.Count > 1 ? numbers[1] : min; // Jeśli jedna liczba, min = max

                // Wyciągamy walutę
                string? currency = null;
                if (salaryText.Contains("PLN"))
                    currency = "PLN";
                else if (salaryText.Contains("EUR"))
                    currency = "EUR";
                else if (salaryText.Contains("USD"))
                    currency = "USD";

                // Wyciągamy okres
                SalaryPeriod? period = null;
                var lowerText = salaryText.ToLower();
                if (lowerText.Contains("hour"))
                    period = SalaryPeriod.Hour;
                else if (lowerText.Contains("day"))
                    period = SalaryPeriod.Day;
                else if (lowerText.Contains("month"))
                    period = SalaryPeriod.Month;
                else if (lowerText.Contains("year"))
                    period = SalaryPeriod.Year;

                return (min, max, currency, period);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    "Nie udało się sparsować salary: {SalaryText}, błąd: {Error}",
                    salaryText,
                    ex.Message
                );
                return (null, null, null, null);
            }
        }

        private List<JobOfferLocation> ParseLocations(string? cityText, Guid jobOfferId)
        {
            var locations = new List<JobOfferLocation>();

            if (string.IsNullOrWhiteSpace(cityText))
                return locations;

            // Rozbijamy po przecinku
            var cities = cityText.Split(',', StringSplitOptions.RemoveEmptyEntries);

            foreach (var city in cities)
            {
                var trimmedCity = city.Trim();
                var isRemote = trimmedCity.ToLower().Contains("remote");

                locations.Add(
                    new JobOfferLocation
                    {
                        Id = Guid.NewGuid(),
                        JobOfferId = jobOfferId,
                        City = isRemote ? "" : trimmedCity,
                        IsRemote = isRemote,
                    }
                );
            }

            if (locations.Count == 0 && !string.IsNullOrWhiteSpace(cityText))
            {
                locations.Add(
                    new JobOfferLocation
                    {
                        Id = Guid.NewGuid(),
                        JobOfferId = jobOfferId,
                        City = cityText.Trim(),
                        IsRemote = false,
                    }
                );
            }

            return locations;
        }

        private List<JobOfferSkill> ParseSkills(string? description, Guid jobOfferId)
        {
            var skills = new List<JobOfferSkill>();

            if (string.IsNullOrWhiteSpace(description))
                return skills;

            // Szukamy sekcji "Requirements:" w description
            var requirementsMatch = Regex.Match(
                description,
                @"Requirements:\s*(.+?)(?:Additionally:|$)",
                RegexOptions.IgnoreCase
            );

            if (!requirementsMatch.Success)
                return skills;

            var requirementsText = requirementsMatch.Groups[1].Value;

            // Rozbijamy po przecinku
            var skillNames = requirementsText.Split(',', StringSplitOptions.RemoveEmptyEntries);

            foreach (var skillName in skillNames)
            {
                var trimmed = skillName.Trim();

                // Pomijamy puste lub bardzo krótkie
                if (trimmed.Length < 2)
                    continue;

                skills.Add(
                    new JobOfferSkill
                    {
                        Id = Guid.NewGuid(),
                        JobOfferId = jobOfferId,
                        Name = trimmed,
                    }
                );
            }

            return skills;
        }
    }
}
