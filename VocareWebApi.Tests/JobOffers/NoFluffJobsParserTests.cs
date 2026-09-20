using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Models.Options;
using VocareWebAPI.JobOffers.Services.Implementations;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>
    /// Testy jednostkowe <see cref="NoFluffJobsParser"/> – parsowanie feedu XML NoFluffJobs
    /// na encje <see cref="JobOffer"/> (senioralność, wynagrodzenie, lokalizacje, umiejętności).
    /// </summary>
    public sealed class NoFluffJobsParserTests
    {
        private const string Feed = """
            <source>
              <job>
                <referencenumber>NFJ-1</referencenumber>
                <title>Backend Developer</title>
                <company>Acme</company>
                <url>https://nofluffjobs.com/job/1</url>
                <country>Poland</country>
                <category>backend</category>
                <jobtype>fulltime</jobtype>
                <seniority>Senior</seniority>
                <salary>18000 - 25000 PLN / month</salary>
                <city>Warszawa, Remote</city>
                <description>About the role. Requirements: C#, PostgreSQL, Docker Additionally: nice to have Kubernetes</description>
                <brief_job_description>Build APIs</brief_job_description>
                <date>Mon, 03 Feb 2025 09:00:00 +01:00</date>
              </job>
              <job>
                <referencenumber>NFJ-2</referencenumber>
                <title>Junior QA</title>
                <company>Beta</company>
                <seniority>junior</seniority>
                <description>No structured requirements here.</description>
                <city>Kraków</city>
                <date>invalid-date</date>
              </job>
            </source>
            """;

        private static NoFluffJobsParser CreateSut(string feed)
        {
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                feed,
                "application/xml"
            );
            return new NoFluffJobsParser(
                new HttpClient(handler),
                NullLogger<NoFluffJobsParser>.Instance,
                Options.Create(
                    new NofluffJobsFetchOptions { NoFluffJobsfeed = "https://feed.test/xml" }
                )
            );
        }

        private static async Task<List<JobOffer>> CollectAsync(NoFluffJobsParser parser)
        {
            var offers = new List<JobOffer>();
            await foreach (var offer in parser.FetchOffersAsync())
                offers.Add(offer);
            return offers;
        }

        [Fact]
        public async Task FetchOffersAsync_ParsesEachJobElement()
        {
            var offers = await CollectAsync(CreateSut(Feed));

            offers.Should().HaveCount(2);
            offers.Select(o => o.ReferenceNumber).Should().Contain(new[] { "NFJ-1", "NFJ-2" });
        }

        [Fact]
        public async Task FetchOffersAsync_MapsCoreFieldsAndSeniority()
        {
            var offer = (await CollectAsync(CreateSut(Feed))).Single(o =>
                o.ReferenceNumber == "NFJ-1"
            );

            offer.Title.Should().Be("Backend Developer");
            offer.CompanyName.Should().Be("Acme");
            offer.Category.Should().Be("backend");
            offer.SeniorityLevel.Should().Be(SeniorityLevel.Senior);
            offer.Source.Should().Be(JobOfferSource.NofluffJobs);
        }

        [Fact]
        public async Task FetchOffersAsync_ParsesSalaryRangeCurrencyAndPeriod()
        {
            var offer = (await CollectAsync(CreateSut(Feed))).Single(o =>
                o.ReferenceNumber == "NFJ-1"
            );

            offer.SalaryMin.Should().Be(18000);
            offer.SalaryMax.Should().Be(25000);
            offer.SalaryCurrency.Should().Be("PLN");
            offer.SalaryPeriod.Should().Be(SalaryPeriod.Month);
        }

        [Fact]
        public async Task FetchOffersAsync_ParsesLocationsWithRemoteFlag()
        {
            var offer = (await CollectAsync(CreateSut(Feed))).Single(o =>
                o.ReferenceNumber == "NFJ-1"
            );

            offer.Locations.Should().HaveCount(2);
            offer.Locations.Should().Contain(l => l.City == "Warszawa" && !l.IsRemote);
            offer.Locations.Should().Contain(l => l.IsRemote);
        }

        [Fact]
        public async Task FetchOffersAsync_ExtractsSkillsFromRequirementsSection()
        {
            var offer = (await CollectAsync(CreateSut(Feed))).Single(o =>
                o.ReferenceNumber == "NFJ-1"
            );

            offer.Skills.Select(s => s.Name).Should().Contain(new[] { "C#", "PostgreSQL" });
        }

        [Fact]
        public async Task FetchOffersAsync_WhenNoRequirementsSection_LeavesSkillsEmpty()
        {
            var offer = (await CollectAsync(CreateSut(Feed))).Single(o =>
                o.ReferenceNumber == "NFJ-2"
            );

            offer.Skills.Should().BeEmpty();
            offer.SeniorityLevel.Should().Be(SeniorityLevel.Junior);
        }
    }
}
