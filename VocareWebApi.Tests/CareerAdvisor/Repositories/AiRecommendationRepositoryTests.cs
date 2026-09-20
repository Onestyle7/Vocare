using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.CareerAdvisor.Exceptions;
using VocareWebAPI.Data;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.CareerAdvisor.Repositories
{
    /// <summary>Testy jednostkowe <see cref="AiRecommendationRepository"/> (dostawca InMemory).</summary>
    public sealed class AiRecommendationRepositoryTests : IDisposable
    {
        private const string UserId = "user-123";

        private readonly AppDbContext _context;
        private readonly AiRecommendationRepository _sut;

        public AiRecommendationRepositoryTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new AiRecommendationRepository(_context);
        }

        public void Dispose() => _context.Dispose();

        private async Task SeedUserProfileAsync()
        {
            _context.UserProfiles.Add(new UserProfile { UserId = UserId, FirstName = "Ada" });
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
        }

        private static AiRecommendation Recommendation(DateTime date, string primaryPath) =>
            new()
            {
                Id = Guid.NewGuid(),
                UserId = UserId,
                RecommendationDate = date,
                PrimaryPath = primaryPath,
            };

        [Fact]
        public async Task AddRecommendationAsync_PersistsRecommendation()
        {
            await SeedUserProfileAsync();

            await _sut.AddRecommendationAsync(Recommendation(DateTime.UtcNow, "Backend"));

            _context.ChangeTracker.Clear();
            (await _context.AiRecommendations.CountAsync()).Should().Be(1);
        }

        [Fact]
        public async Task GetLatestByUserIdAsync_ReturnsMostRecentByRecommendationDate()
        {
            await SeedUserProfileAsync();
            await _sut.AddRecommendationAsync(
                Recommendation(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), "Old")
            );
            await _sut.AddRecommendationAsync(
                Recommendation(new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc), "New")
            );
            _context.ChangeTracker.Clear();

            var latest = await _sut.GetLatestByUserIdAsync(UserId);

            latest.Should().NotBeNull();
            latest!.PrimaryPath.Should().Be("New");
        }

        [Fact]
        public async Task GetLatestByUserIdAsync_WhenNoRecommendations_ReturnsNull()
        {
            (await _sut.GetLatestByUserIdAsync(UserId)).Should().BeNull();
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public async Task GetLatestByUserIdAsync_WithInvalidUserId_ThrowsArgumentException(
            string? userId
        )
        {
            await _sut.Invoking(r => r.GetLatestByUserIdAsync(userId!))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task IncrementMarketAnalysisCountAsync_IncrementsCounter()
        {
            await SeedUserProfileAsync();
            var recommendation = Recommendation(DateTime.UtcNow, "Backend");
            await _sut.AddRecommendationAsync(recommendation);
            _context.ChangeTracker.Clear();

            await _sut.IncrementMarketAnalysisCountAsync(recommendation.Id);

            _context.ChangeTracker.Clear();
            var reloaded = await _context.AiRecommendations.SingleAsync();
            reloaded.MarketAnalysisCount.Should().Be(1);
        }

        [Fact]
        public async Task IncrementMarketAnalysisCountAsync_WithEmptyGuid_ThrowsArgumentException()
        {
            await _sut.Invoking(r => r.IncrementMarketAnalysisCountAsync(Guid.Empty))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task IncrementMarketAnalysisCountAsync_WhenRecommendationMissing_Throws()
        {
            await _sut.Invoking(r => r.IncrementMarketAnalysisCountAsync(Guid.NewGuid()))
                .Should()
                .ThrowAsync<RecommendationNotFoundException>();
        }
    }
}
