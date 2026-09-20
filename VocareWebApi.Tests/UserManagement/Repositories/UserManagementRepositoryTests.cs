using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.Data;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Exceptions;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Repositories;
using VocareWebAPI.UserManagement.Repositories.Implementations;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Repositories
{
    /// <summary>
    /// Testy jednostkowe repozytoriów modułu UserManagement (dostawca InMemory):
    /// <see cref="UserProfileRepository"/>, <see cref="DashboardRepository"/>,
    /// <see cref="ProfileAttributesRepository"/>, <see cref="MarketingConsentRepository"/>,
    /// <see cref="CvParseHistoryRepository"/>.
    /// </summary>
    public sealed class UserManagementRepositoryTests : IDisposable
    {
        private const string UserId = "user-123";

        private readonly AppDbContext _context;

        public UserManagementRepositoryTests()
        {
            _context = TestDbContextFactory.CreateContext();
        }

        public void Dispose() => _context.Dispose();

        // ---------- UserProfileRepository ----------

        [Fact]
        public async Task UserProfileRepository_GetById_WhenMissing_Throws()
        {
            var sut = new UserProfileRepository(_context);

            await sut.Invoking(r => r.GetUserProfileByIdAsync(UserId))
                .Should()
                .ThrowAsync<UserProfileNotFoundException>();
        }

        [Fact]
        public async Task UserProfileRepository_GetById_ReturnsProfileWithCollections()
        {
            _context.Users.Add(new User { Id = UserId, Email = "ada@example.com" });
            _context.UserProfiles.Add(
                new UserProfile
                {
                    UserId = UserId,
                    FirstName = "Ada",
                    Skills = new List<string> { "C#" },
                }
            );
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
            var sut = new UserProfileRepository(_context);

            var profile = await sut.GetUserProfileByIdAsync(UserId);

            profile.FirstName.Should().Be("Ada");
            profile.Skills.Should().Contain("C#");
        }

        [Fact]
        public async Task UserProfileRepository_SaveChanges_PersistsTrackedEdits()
        {
            _context.UserProfiles.Add(new UserProfile { UserId = UserId, FirstName = "Ada" });
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
            var sut = new UserProfileRepository(_context);

            var tracked = await sut.GetTrackedProfileWithCollectionsAsync(UserId);
            tracked.FirstName = "Grace";
            await sut.SaveChangesAsync();

            _context.ChangeTracker.Clear();
            (await _context.UserProfiles.SingleAsync()).FirstName.Should().Be("Grace");
        }

        // ---------- DashboardRepository ----------

        [Fact]
        public async Task DashboardRepository_AggregatesUserActivityCounts()
        {
            _context.AiRecommendations.Add(
                new AiRecommendation
                {
                    Id = Guid.NewGuid(),
                    UserId = UserId,
                    MarketAnalysisCount = 2,
                }
            );
            _context.AiRecommendations.Add(
                new AiRecommendation
                {
                    Id = Guid.NewGuid(),
                    UserId = UserId,
                    MarketAnalysisCount = 3,
                }
            );
            _context.GeneratedCvs.Add(
                new GeneratedCv
                {
                    Id = Guid.NewGuid(),
                    UserId = UserId,
                    Name = "CV",
                    CvJson = "{}",
                }
            );
            _context.Roadmaps.Add(
                new Roadmap
                {
                    Id = Guid.NewGuid(),
                    UserId = UserId,
                    CareerPathId = Guid.NewGuid(),
                }
            );
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
            var sut = new DashboardRepository(_context);

            (await sut.GetRecommendationsCountAsync(UserId)).Should().Be(2);
            (await sut.GetAnalysesCountAsync(UserId)).Should().Be(5);
            (await sut.GetCvsCountAsync(UserId)).Should().Be(1);
            (await sut.GetRoadmapsCountAsync(UserId)).Should().Be(1);
        }

        // ---------- ProfileAttributesRepository ----------

        [Fact]
        public async Task ProfileAttributesRepository_SaveAsync_InsertsThenUpdatesInPlace()
        {
            var sut = new ProfileAttributesRepository(_context);

            await sut.SaveAsync(
                new ProfileAttributes
                {
                    Id = Guid.NewGuid(),
                    UserId = UserId,
                    Creativity = 40,
                }
            );
            await sut.SaveAsync(
                new ProfileAttributes
                {
                    Id = Guid.NewGuid(),
                    UserId = UserId,
                    Creativity = 90,
                }
            );

            _context.ChangeTracker.Clear();
            (await _context.ProfileAttributes.CountAsync()).Should().Be(1);
            (await sut.GetByUserIdAsync(UserId))!.Creativity.Should().Be(90);
        }

        [Fact]
        public async Task ProfileAttributesRepository_SaveAsync_WithBlankUserId_Throws()
        {
            var sut = new ProfileAttributesRepository(_context);

            await sut.Invoking(r => r.SaveAsync(new ProfileAttributes { UserId = "" }))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        // ---------- MarketingConsentRepository ----------

        [Fact]
        public async Task MarketingConsentRepository_HasActiveConsent_ReflectsStoredFlag()
        {
            var sut = new MarketingConsentRepository(_context);
            await sut.CreateAsync(new MarketingConsent { UserId = UserId, IsConsentGiven = true });

            (await sut.HasActiveConsentAsync(UserId)).Should().BeTrue();
            (await sut.HasActiveConsentAsync("nobody")).Should().BeFalse();
        }

        // ---------- CvParseHistoryRepository ----------

        [Fact]
        public async Task CvParseHistoryRepository_CountByUserId_CountsOnlyThatUser()
        {
            var sut = new CvParseHistoryRepository(_context);
            await sut.CreateAsync(new CvParseHistory { UserId = UserId });
            await sut.CreateAsync(new CvParseHistory { UserId = "other" });

            (await sut.CountByUserIdAsync(UserId)).Should().Be(1);
        }
    }
}
