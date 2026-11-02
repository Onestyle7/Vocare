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

        [Theory]
        [InlineData("from 100 to 150 PLN per hour", 100, 150, "PLN", SalaryPeriod.Hour)]
        [InlineData("from 1200 to 1500 PLN per day", 1200, 1500, "PLN", SalaryPeriod.Day)]
        [InlineData("from 52.5 PLN per hour", 52.5, 52.5, "PLN", SalaryPeriod.Hour)]
        [InlineData("from 52.5 to 60.75 EUR per hour", 52.5, 60.75, "EUR", SalaryPeriod.Hour)]
        public async Task FetchOffersAsync_ParsesFeedSalaryFormats(
            string salary,
            double expectedMin,
            double expectedMax,
            string expectedCurrency,
            SalaryPeriod expectedPeriod
        )
        {
            var feed = $"""
                <source>
                  <job>
                    <referencenumber>NFJ-3</referencenumber>
                    <title>Contractor</title>
                    <salary><![CDATA[{salary}]]></salary>
                    <city>Remote</city>
                  </job>
                </source>
                """;

            var offer = (await CollectAsync(CreateSut(feed))).Single();

            offer.SalaryMin.Should().Be((decimal)expectedMin);
            offer.SalaryMax.Should().Be((decimal)expectedMax);
            offer.SalaryCurrency.Should().Be(expectedCurrency);
            offer.SalaryPeriod.Should().Be(expectedPeriod);
        }

        [Theory]
        [InlineData("Wed, 30 Sep 2026 14:02:06 CEST", "2026-09-30T12:02:06Z")]
        [InlineData("Tue, 03 Feb 2026 09:15:00 CET", "2026-02-03T08:15:00Z")]
        public async Task FetchOffersAsync_ParsesFeedDateWithTimeZoneAbbreviation(
            string date,
            string expectedUtc
        )
        {
            var feed = $"""
                <source>
                  <job>
                    <referencenumber>NFJ-4</referencenumber>
                    <title>Tester</title>
                    <date><![CDATA[{date}]]></date>
                  </job>
                </source>
                """;

            var offer = (await CollectAsync(CreateSut(feed))).Single();

            offer
                .PublishedAt.Should()
                .Be(
                    DateTime.Parse(
                        expectedUtc,
                        null,
                        System.Globalization.DateTimeStyles.AdjustToUniversal
                    )
                );
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
