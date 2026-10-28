using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Pgvector;
using VocareWebAPI.CareerAdvisor.Repositories.Interfaces;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Exceptions;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Implementations;
using VocareWebAPI.JobOffers.Services.Interfaces;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>
    /// Testy jednostkowe <see cref="JobOfferMatchingService"/> – ścieżki brzegowe oraz mapowanie
    /// ofert na DTO. Wyszukiwanie wektorowe w PostgreSQL jest zastąpione mockiem repozytorium.
    /// </summary>
    public sealed class JobOfferMatchingServiceTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly Mock<IJobOfferRecommendationRepository> _recommendationRepository = new();
        private readonly Mock<ISkillMatchingService> _skillMatchingService = new();
        private readonly Mock<IScoringService> _scoringService = new();
        private readonly JobOfferMatchingService _sut;

        public JobOfferMatchingServiceTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _skillMatchingService
                .Setup(s =>
                    s.CalculateSkillMatchAsync(It.IsAny<List<string>>(), It.IsAny<List<string>>())
                )
                .ReturnsAsync(new SkillMatchResult());
            _scoringService
                .Setup(s => s.DetermineConfidenceLevel(It.IsAny<int>(), It.IsAny<int>()))
                .Returns("medium");
            _sut = new JobOfferMatchingService(
                _context,
                _recommendationRepository.Object,
                new Mock<IAiRecommendationRepository>().Object,
                NullLogger<JobOfferMatchingService>.Instance,
                _skillMatchingService.Object,
                _scoringService.Object
            );
        }

        public void Dispose() => _context.Dispose();

        private static Vector SampleEmbedding() => new(new float[] { 1f, 0f, 0f });

        private async Task<CareerPath> SeedCareerPathAsync(
            List<string>? allowedJobCategories = null
        )
        {
            var careerPath = new CareerPath
            {
                Id = Guid.NewGuid(),
                CareerName = "Business Analyst",
                Embedding = SampleEmbedding(),
                SwotAnalysis = new SwotAnalysis(),
                AllowedJobCategories = allowedJobCategories ?? new List<string>(),
            };

            if (allowedJobCategories == null)
            {
                _context.CareerPaths.Add(careerPath);
            }
            else
            {
                // Filtry kategorii są brane z rekomendacji powiązanej z profilem użytkownika
                const string userId = "user-1";
                _context.Users.Add(new User { Id = userId, UserName = "ada@test.pl" });
                _context.UserProfiles.Add(new UserProfile { UserId = userId });
                _context.AiRecommendations.Add(
                    new AiRecommendation
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        CareerPaths = new List<CareerPath> { careerPath },
                    }
                );
            }

            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
            return careerPath;
        }

        private void RepositoryReturns(params JobOffer[] offers) =>
            _recommendationRepository
                .Setup(r =>
                    r.GetMatchingOffersAsync(
                        It.IsAny<Vector>(),
                        It.IsAny<JobOfferFilterCriteria>(),
                        It.IsAny<int>()
                    )
                )
                .ReturnsAsync(offers.ToList());

        private static JobOffer SolidJobsOffer() =>
            new()
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "SJ-1",
                Title = "Analityk biznesowy",
                Category = "businessAnalyst",
                Description =
                    "<div class=\"well job - description\"><p><strong>Czym będziesz się zajmować?</strong><br><br>"
                    + "<span style=\"color: rgb(55, 51, 57);\">Analiza wymagań biznesowych</span></p></div>",
                BriefDescription = "",
                SalaryMin = 120,
                SalaryMax = 150,
                SalaryCurrency = "PLN",
                SalaryPeriod = SalaryPeriod.Hour,
                Source = JobOfferSource.SolidJobs,
                Embedding = SampleEmbedding(),
                Locations = new List<JobOfferLocation>
                {
                    new() { City = "Warszawa", IsRemote = true },
                    new() { City = "Kraków", IsRemote = true },
                },
            };

        [Fact]
        public async Task GetMatchingOffersForCareerPathAsync_WhenCareerPathMissing_Throws()
        {
            await _sut.Invoking(s => s.GetMatchingOffersForCareerPathAsync(Guid.NewGuid()))
                .Should()
                .ThrowAsync<CareerPathNotFoundException>();
        }

        [Fact]
        public async Task GetMatchingOffersForCareerPathAsync_WhenCareerPathHasNoEmbedding_ReturnsEmptyList()
        {
            var careerPath = new CareerPath
            {
                Id = Guid.NewGuid(),
                CareerName = "Backend Developer",
                Embedding = null,
                SwotAnalysis = new SwotAnalysis(),
            };
            _context.CareerPaths.Add(careerPath);
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();

            var result = await _sut.GetMatchingOffersForCareerPathAsync(careerPath.Id);

            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetMatchingOffersForCareerPathAsync_MapsSourcePeriodPreviewAndLocations()
        {
            var careerPath = await SeedCareerPathAsync();
            RepositoryReturns(SolidJobsOffer());

            var dto = (await _sut.GetMatchingOffersForCareerPathAsync(careerPath.Id)).Single();

            dto.Source.Should().Be(JobOfferSource.SolidJobs);
            dto.SalaryPeriod.Should().Be(SalaryPeriod.Hour);
            dto.DescriptionPreview.Should().Be("Analiza wymagań biznesowych");
            dto.Locations.Should().Equal("Warszawa", "Kraków", "Remote");
        }

        [Fact]
        public async Task GetMatchingOffersWithScoreAsync_MapsSourcePeriodPreviewAndLocations()
        {
            var careerPath = await SeedCareerPathAsync();
            RepositoryReturns(SolidJobsOffer());

            var dto = (
                await _sut.GetMatchingOffersWithScoreAsync(careerPath.Id)
            ).MatchedOffers.Single();

            dto.Source.Should().Be(JobOfferSource.SolidJobs);
            dto.SalaryPeriod.Should().Be(SalaryPeriod.Hour);
            dto.DescriptionPreview.Should().Be("Analiza wymagań biznesowych");
            dto.Locations.Should().Equal("Warszawa", "Kraków", "Remote");
        }

        [Fact]
        public async Task GetMatchingOffersWithScoreAsync_MatchesCamelCaseCategoryIgnoringCase()
        {
            var careerPath = await SeedCareerPathAsync(new List<string> { "businessAnalyst" });
            RepositoryReturns(SolidJobsOffer());

            var dto = (
                await _sut.GetMatchingOffersWithScoreAsync(careerPath.Id)
            ).MatchedOffers.Single();

            dto.MatchDetails.BonusFactors.Should().Contain("categoryMatch");
            _scoringService.Verify(s =>
                s.CalculateFinalScore(
                    It.IsAny<double>(),
                    It.IsAny<double>(),
                    true,
                    It.IsAny<bool>()
                )
            );
        }
    }
}
