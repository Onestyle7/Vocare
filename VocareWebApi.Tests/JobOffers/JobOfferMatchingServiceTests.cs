using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Pgvector;
using VocareWebAPI.CareerAdvisor.Repositories.Interfaces;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Exceptions;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Implementations;
using VocareWebAPI.JobOffers.Services.Interfaces;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>
    /// Testy jednostkowe <see cref="JobOfferMatchingService"/> – ścieżki brzegowe, które nie
    /// wymagają wyszukiwania wektorowego w PostgreSQL.
    /// </summary>
    public sealed class JobOfferMatchingServiceTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly JobOfferMatchingService _sut;

        public JobOfferMatchingServiceTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new JobOfferMatchingService(
                _context,
                new Mock<IJobOfferRecommendationRepository>().Object,
                new Mock<IAiRecommendationRepository>().Object,
                NullLogger<JobOfferMatchingService>.Instance,
                new Mock<ISkillMatchingService>().Object,
                new Mock<IScoringService>().Object
            );
        }

        public void Dispose() => _context.Dispose();

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
    }
}
