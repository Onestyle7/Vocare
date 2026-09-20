using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;
using VocareWebAPI.RoadmapService.Repositories.Implementations;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.RoadmapService
{
    /// <summary>Testy jednostkowe <see cref="RoadmapRepository"/> (dostawca InMemory).</summary>
    public sealed class RoadmapRepositoryTests : IDisposable
    {
        private const string UserId = "user-123";

        private readonly AppDbContext _context;
        private readonly RoadmapRepository _sut;

        public RoadmapRepositoryTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new RoadmapRepository(_context);
        }

        public void Dispose() => _context.Dispose();

        private async Task<Roadmap> SeedRoadmapAsync(
            string userId = UserId,
            Guid? careerPathId = null,
            LifecycleStatus lifecycle = LifecycleStatus.Draft,
            GenerationStatus generation = GenerationStatus.Ready,
            DateTime? createdAt = null
        )
        {
            var roadmap = new Roadmap
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CareerPathId = careerPathId ?? Guid.NewGuid(),
                Title = "Roadmap",
                LifecycleStatus = lifecycle,
                GenerationStatus = generation,
                CreatedAt = createdAt ?? DateTime.UtcNow,
                Phases = new List<RoadmapPhase>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        Title = "Phase B",
                        OrderIndex = 1,
                        Steps = new List<RoadmapStep>
                        {
                            new()
                            {
                                Id = Guid.NewGuid(),
                                Title = "Step B2",
                                OrderIndex = 1,
                            },
                            new()
                            {
                                Id = Guid.NewGuid(),
                                Title = "Step B1",
                                OrderIndex = 0,
                            },
                        },
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        Title = "Phase A",
                        OrderIndex = 0,
                        Steps = new List<RoadmapStep>(),
                    },
                },
            };
            _context.Roadmaps.Add(roadmap);
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
            return roadmap;
        }

        [Fact]
        public async Task GetByIdAsync_OrdersPhasesAndStepsByOrderIndex()
        {
            var roadmap = await SeedRoadmapAsync();

            var result = await _sut.GetByIdAsync(roadmap.Id);

            result.Should().NotBeNull();
            result!.Phases.Select(p => p.Title).Should().ContainInOrder("Phase A", "Phase B");
            result
                .Phases.Single(p => p.Title == "Phase B")
                .Steps.Select(s => s.Title)
                .Should()
                .ContainInOrder("Step B1", "Step B2");
        }

        [Fact]
        public async Task GetByUserIdAsync_ExcludesArchivedAndOrdersNewestFirst()
        {
            await SeedRoadmapAsync(
                lifecycle: LifecycleStatus.Archived,
                createdAt: new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc)
            );
            await SeedRoadmapAsync(createdAt: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
            await SeedRoadmapAsync(createdAt: new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc));

            var result = await _sut.GetByUserIdAsync(UserId);

            result.Should().HaveCount(2);
            result[0].CreatedAt.Should().Be(new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc));
        }

        [Fact]
        public async Task GetByCareerPathIdAsync_IgnoresArchivedAndFailedRoadmaps()
        {
            var careerPathId = Guid.NewGuid();
            await SeedRoadmapAsync(careerPathId: careerPathId, generation: GenerationStatus.Failed);

            (await _sut.GetByCareerPathIdAsync(careerPathId)).Should().BeNull();

            await SeedRoadmapAsync(careerPathId: careerPathId, generation: GenerationStatus.Ready);
            (await _sut.GetByCareerPathIdAsync(careerPathId)).Should().NotBeNull();
        }

        [Fact]
        public async Task CountActiveRoadmapsAsync_CountsOnlyLiveRoadmaps()
        {
            await SeedRoadmapAsync();
            await SeedRoadmapAsync(generation: GenerationStatus.Failed);
            await SeedRoadmapAsync(lifecycle: LifecycleStatus.Archived);
            await SeedRoadmapAsync(userId: "other");

            (await _sut.CountActiveRoadmapsAsync(UserId)).Should().Be(1);
        }

        [Fact]
        public async Task DeleteAsync_SoftDeletesByArchiving()
        {
            var roadmap = await SeedRoadmapAsync();

            await _sut.DeleteAsync(roadmap.Id);

            _context.ChangeTracker.Clear();
            var reloaded = await _context.Roadmaps.SingleAsync(r => r.Id == roadmap.Id);
            reloaded.LifecycleStatus.Should().Be(LifecycleStatus.Archived);
        }
    }
}
