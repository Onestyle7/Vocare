using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Moq;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.CareerAdvisor.Repositories.Interfaces;
using VocareWebAPI.Data;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.RoadmapService.Exceptions;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;
using VocareWebAPI.RoadmapService.Repositories.Interfaces;
using VocareWebAPI.RoadmapService.Services.Implementations;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.RoadmapService
{
    /// <summary>
    /// Testy jednostkowe <see cref="CareerRoadmapService"/> – reguły limitu i dostępu przy
    /// generowaniu roadmapy oraz operacje na istniejących roadmapach.
    /// </summary>
    public sealed class CareerRoadmapServiceTests : IDisposable
    {
        private const string UserId = "user-123";

        private readonly AppDbContext _context;
        private readonly Mock<IRoadmapRepository> _roadmaps = new();
        private readonly Mock<IBackgroundJobClient> _backgroundJobs = new();
        private readonly Mock<IUserProfileRepository> _profiles = new();
        private readonly Mock<ICareerPathRepository> _careerPaths = new();
        private readonly Mock<IUserBillingRepository> _billing = new();
        private readonly CareerRoadmapService _sut;

        public CareerRoadmapServiceTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _billing
                .Setup(b => b.GetByUserIdAsync(UserId))
                .ReturnsAsync(new UserBilling { UserId = UserId });
            _backgroundJobs
                .Setup(c => c.Create(It.IsAny<Job>(), It.IsAny<IState>()))
                .Returns("job-1");
            _sut = new CareerRoadmapService(
                _roadmaps.Object,
                _context,
                _backgroundJobs.Object,
                _profiles.Object,
                _careerPaths.Object,
                _billing.Object
            );
        }

        public void Dispose() => _context.Dispose();

        private async Task<Guid> SeedOwnedCareerPathAsync()
        {
            var careerPathId = Guid.NewGuid();
            _context.AiRecommendations.Add(
                new AiRecommendation
                {
                    Id = Guid.NewGuid(),
                    UserId = UserId,
                    CareerPaths = new List<CareerPath>
                    {
                        new()
                        {
                            Id = careerPathId,
                            CareerName = "Backend Developer",
                            SwotAnalysis = new SwotAnalysis(),
                        },
                    },
                }
            );
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
            return careerPathId;
        }

        // ---------- GenerateRoadmapAsync ----------

        [Fact]
        public async Task GenerateRoadmapAsync_WhenFreeUserAtLimit_ThrowsRoadmapLimitReached()
        {
            _roadmaps.Setup(r => r.CountActiveRoadmapsAsync(UserId)).ReturnsAsync(1);

            await _sut.Invoking(s => s.GenerateRoadmapAsync(UserId, Guid.NewGuid(), 12))
                .Should()
                .ThrowAsync<RoadmapLimitReachedException>();
        }

        [Fact]
        public async Task GenerateRoadmapAsync_WhenDuplicateRoadmapExists_ThrowsDuplicate()
        {
            var careerPathId = Guid.NewGuid();
            _roadmaps.Setup(r => r.CountActiveRoadmapsAsync(UserId)).ReturnsAsync(0);
            _roadmaps
                .Setup(r => r.GetByCareerPathIdAsync(careerPathId))
                .ReturnsAsync(new Roadmap { UserId = UserId });

            await _sut.Invoking(s => s.GenerateRoadmapAsync(UserId, careerPathId, 12))
                .Should()
                .ThrowAsync<DuplicateRoadmapException>();
        }

        [Theory]
        [InlineData(2)]
        [InlineData(25)]
        public async Task GenerateRoadmapAsync_WithInvalidTimeHorizon_Throws(int months)
        {
            _roadmaps.Setup(r => r.CountActiveRoadmapsAsync(UserId)).ReturnsAsync(0);
            _roadmaps
                .Setup(r => r.GetByCareerPathIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Roadmap?)null);

            await _sut.Invoking(s => s.GenerateRoadmapAsync(UserId, Guid.NewGuid(), months))
                .Should()
                .ThrowAsync<InvalidRoadmapTimeHorizonException>();
        }

        [Fact]
        public async Task GenerateRoadmapAsync_WhenCareerPathNotOwned_ThrowsAccessDenied()
        {
            _roadmaps.Setup(r => r.CountActiveRoadmapsAsync(UserId)).ReturnsAsync(0);
            _roadmaps
                .Setup(r => r.GetByCareerPathIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Roadmap?)null);

            await _sut.Invoking(s => s.GenerateRoadmapAsync(UserId, Guid.NewGuid(), 12))
                .Should()
                .ThrowAsync<RoadmapAccessDeniedException>();
        }

        [Fact]
        public async Task GenerateRoadmapAsync_HappyPath_PersistsRoadmapAndEnqueuesJob()
        {
            var careerPathId = await SeedOwnedCareerPathAsync();
            _roadmaps.Setup(r => r.CountActiveRoadmapsAsync(UserId)).ReturnsAsync(0);
            _roadmaps
                .Setup(r => r.GetByCareerPathIdAsync(careerPathId))
                .ReturnsAsync((Roadmap?)null);
            _roadmaps.Setup(r => r.AddAsync(It.IsAny<Roadmap>())).Returns(Task.CompletedTask);
            _roadmaps.Setup(r => r.UpdateAsync(It.IsAny<Roadmap>())).Returns(Task.CompletedTask);
            _careerPaths
                .Setup(r => r.GetByIdAsync(careerPathId))
                .ReturnsAsync(
                    new CareerPath { Id = careerPathId, CareerName = "Backend Developer" }
                );
            _profiles
                .Setup(r => r.GetUserProfileByIdAsync(UserId))
                .ReturnsAsync(
                    new UserProfile
                    {
                        UserId = UserId,
                        Skills = new List<string> { "C#" },
                    }
                );

            var roadmap = await _sut.GenerateRoadmapAsync(UserId, careerPathId, 12);

            roadmap.HangfireJobId.Should().Be("job-1");
            roadmap.GenerationStatus.Should().Be(GenerationStatus.Pending);
            _roadmaps.Verify(r => r.AddAsync(It.IsAny<Roadmap>()), Times.Once);
            _backgroundJobs.Verify(c => c.Create(It.IsAny<Job>(), It.IsAny<IState>()), Times.Once);
        }

        [Fact]
        public async Task GenerateRoadmapAsync_WhenPremium_AllowsMoreRoadmaps()
        {
            _billing
                .Setup(b => b.GetByUserIdAsync(UserId))
                .ReturnsAsync(
                    new UserBilling
                    {
                        UserId = UserId,
                        SubscriptionStatus = SubscriptionStatus.Active,
                    }
                );
            _roadmaps.Setup(r => r.CountActiveRoadmapsAsync(UserId)).ReturnsAsync(5);
            _roadmaps
                .Setup(r => r.GetByCareerPathIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Roadmap?)null);

            // Passes the limit check (5 < 10) and fails later on ownership — proving the limit gate opened.
            await _sut.Invoking(s => s.GenerateRoadmapAsync(UserId, Guid.NewGuid(), 12))
                .Should()
                .ThrowAsync<RoadmapAccessDeniedException>();
        }

        // ---------- GetByIdAsync ----------

        [Fact]
        public async Task GetByIdAsync_WhenMissing_ThrowsRoadmapNotFound()
        {
            _roadmaps.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Roadmap?)null);

            await _sut.Invoking(s => s.GetByIdAsync(Guid.NewGuid(), UserId))
                .Should()
                .ThrowAsync<RoadmapNotFoundException>();
        }

        [Fact]
        public async Task GetByIdAsync_WhenOwnedByAnotherUser_ThrowsAccessDenied()
        {
            var id = Guid.NewGuid();
            _roadmaps
                .Setup(r => r.GetByIdAsync(id))
                .ReturnsAsync(new Roadmap { Id = id, UserId = "other" });

            await _sut.Invoking(s => s.GetByIdAsync(id, UserId))
                .Should()
                .ThrowAsync<RoadmapAccessDeniedException>();
        }

        // ---------- CalculateProgressAsync ----------

        [Fact]
        public async Task CalculateProgressAsync_WithNoRequiredSteps_Returns100()
        {
            var id = Guid.NewGuid();
            _roadmaps
                .Setup(r => r.GetByIdAsync(id))
                .ReturnsAsync(new Roadmap { Id = id, UserId = UserId });

            (await _sut.CalculateProgressAsync(id, UserId)).Should().Be(100.0);
        }

        [Fact]
        public async Task CalculateProgressAsync_CountsCompletedRequiredStepsOnly()
        {
            var id = Guid.NewGuid();
            _roadmaps
                .Setup(r => r.GetByIdAsync(id))
                .ReturnsAsync(
                    new Roadmap
                    {
                        Id = id,
                        UserId = UserId,
                        Phases = new List<RoadmapPhase>
                        {
                            new()
                            {
                                Steps = new List<RoadmapStep>
                                {
                                    new()
                                    {
                                        StepType = StepType.Required,
                                        Status = StepStatus.Completed,
                                    },
                                    new()
                                    {
                                        StepType = StepType.Required,
                                        Status = StepStatus.NotStarted,
                                    },
                                    new()
                                    {
                                        StepType = StepType.Optional,
                                        Status = StepStatus.Completed,
                                    },
                                },
                            },
                        },
                    }
                );

            (await _sut.CalculateProgressAsync(id, UserId)).Should().Be(50.0);
        }

        // ---------- ArchiveAsync / UpdateStatusAsync ----------

        [Fact]
        public async Task ArchiveAsync_WhenOwner_DelegatesDeleteToRepository()
        {
            var id = Guid.NewGuid();
            _roadmaps
                .Setup(r => r.GetByIdAsync(id))
                .ReturnsAsync(new Roadmap { Id = id, UserId = UserId });
            _roadmaps.Setup(r => r.DeleteAsync(id)).Returns(Task.CompletedTask);

            await _sut.ArchiveAsync(id, UserId);

            _roadmaps.Verify(r => r.DeleteAsync(id), Times.Once);
        }

        [Fact]
        public async Task UpdateStatusAsync_WhenOwner_SetsLifecycleStatus()
        {
            var id = Guid.NewGuid();
            var roadmap = new Roadmap { Id = id, UserId = UserId };
            _roadmaps.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(roadmap);
            _roadmaps.Setup(r => r.UpdateAsync(roadmap)).Returns(Task.CompletedTask);

            await _sut.UpdateStatusAsync(id, UserId, LifecycleStatus.Completed);

            roadmap.LifecycleStatus.Should().Be(LifecycleStatus.Completed);
        }

        // ---------- RetryGenerationAsync ----------

        [Fact]
        public async Task RetryGenerationAsync_WhenRoadmapNotFailed_ThrowsInvalidState()
        {
            var id = Guid.NewGuid();
            _roadmaps
                .Setup(r => r.GetByIdAsync(id))
                .ReturnsAsync(
                    new Roadmap
                    {
                        Id = id,
                        UserId = UserId,
                        GenerationStatus = GenerationStatus.Ready,
                    }
                );

            await _sut.Invoking(s => s.RetryGenerationAsync(id, UserId))
                .Should()
                .ThrowAsync<InvalidRoadmapStateException>();
        }
    }
}
