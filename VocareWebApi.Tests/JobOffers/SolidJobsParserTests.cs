using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Web;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using VocareWebAPI.JobOffers.ExternalClients.SolidJobs;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Services.Implementations;
using VocareWebApi.Tests.Common;
using Xunit;
using Sj = VocareWebAPI.JobOffers.ExternalClients.SolidJobs.Models;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>
    /// Testy jednostkowe <see cref="SolidJobsParser"/> – stronicowanie publicznego API SolidJobs.
    /// </summary>
    public sealed class SolidJobsParserTests
    {
        private const int TotalPages = 3;

        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
        {
            Converters = { new JsonStringEnumConverter() },
        };

        private static Sj.JobOffer Offer(string key) =>
            new()
            {
                JobOfferKey = key,
                Title = "Backend Developer",
                Division = Sj.Division.IT,
                Category = Sj.JobCategory.Developer,
                SubCategory = Sj.JobSubCategory.DotNet,
                Company = "Acme",
                Salary = new Sj.Salary
                {
                    From = 18000,
                    To = 25000,
                    Currency = "PLN",
                    Period = "Month",
                    EmploymentType = "B2B",
                },
                ContractTime = "fulltime",
                Locations = new List<string> { "Warszawa" },
                Benefits = new List<string>(),
                IsRemote = false,
                IsHybrid = false,
                Url = $"https://solid.jobs/o/{key}/vocare",
                ExperienceLevel = Sj.ExperienceLevel.Regular,
                Skills = new List<Sj.SkillTag>(),
                Languages = new List<Sj.SkillTag>(),
                Description = "Build APIs",
                ValidFrom = new DateTimeOffset(2025, 2, 1, 0, 0, 0, TimeSpan.Zero),
                ValidTo = new DateTimeOffset(2025, 3, 1, 0, 0, 0, TimeSpan.Zero),
            };

        /// <summary>
        /// Odwzorowuje zachowanie prawdziwego API: pageIndex jest brany pod uwagę tylko razem z pageSize.
        /// </summary>
        private static FakeHttpMessageHandler FakeApi() =>
            new(
                (request, _) =>
                {
                    var query = HttpUtility.ParseQueryString(request.RequestUri!.Query);
                    var pageIndex =
                        query["pageSize"] != null && query["pageIndex"] != null
                            ? int.Parse(query["pageIndex"]!)
                            : 0;
                    // public-api/offers/{division}
                    var division = request.RequestUri.AbsolutePath.Split('/')[^1];

                    var page = new Sj.OffersResponse
                    {
                        Jobs = new List<Sj.JobOffer> { Offer($"{division}-{pageIndex}") },
                        PageIndex = pageIndex,
                        PageSize = 1,
                        TotalCount = TotalPages,
                        TotalPages = TotalPages,
                    };

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(
                                JsonSerializer.Serialize(page, JsonOptions),
                                Encoding.UTF8,
                                "application/json"
                            ),
                        }
                    );
                }
            );

        [Fact]
        public async Task FetchOffersAsync_WalksAllPagesOfAllDivisions()
        {
            var handler = FakeApi();
            var client = new SolidJobsClient(
                new HttpClient(handler) { BaseAddress = new Uri("https://solid.jobs/") }
            );
            var sut = new SolidJobsParser(client, NullLogger<SolidJobsParser>.Instance);

            var offers = new List<JobOffer>();
            await foreach (var offer in sut.FetchOffersAsync())
                offers.Add(offer);

            var expectedKeys =
                from division in Enum.GetValues<Sj.Division>()
                from pageIndex in Enumerable.Range(0, TotalPages)
                select $"{division}-{pageIndex}";
            offers.Select(o => o.ReferenceNumber).Should().Equal(expectedKeys);
            handler
                .Requests.Should()
                .OnlyContain(r => r.RequestUri!.Query.Contains("pageSize=500"));
        }
    }
}
