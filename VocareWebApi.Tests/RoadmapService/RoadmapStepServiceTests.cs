using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using VocareWebAPI.Data;
using VocareWebAPI.RoadmapService.Exceptions;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;
using VocareWebAPI.RoadmapService.Services.Implementations;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.RoadmapService
{
    /// <summary>Testy jednostkowe <see cref="RoadmapStepService"/> (dostawca InMemory).</summary>
    public sealed class RoadmapStepServiceTests : IDisposable
    {
        private const string UserId = "user-123";

        private readonly AppDbContext _context;
        private readonly RoadmapStepService _sut;

        public RoadmapStepServiceTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new RoadmapStepService(_context, NullLogger<RoadmapStepService>.Instance);
        }

        public void Dispose() => _context.Dispose();

        // ---------- ChangeStatusAsync ----------

        [Fact]
        public async Task ChangeStatusAsync_WhenStepMissing_ThrowsStepNotFound()
        {
            await _sut.Invoking(s =>
                    s.ChangeStatusAsync(Guid.NewGuid(), UserId, StepStatus.Completed)
                )
                .Should()
                .ThrowAsync<RoadmapStepNotFoundException>();
        }

        [Fact]
        public async Task ChangeStatusAsync_WhenNotOwner_ThrowsAccessDenied()
        {
            var (_, _, step) = await RoadmapGraphBuilder.SeedAsync(_context, "other");

            await _sut.Invoking(s => s.ChangeStatusAsync(step.Id, UserId, StepStatus.Completed))
                .Should()
                .ThrowAsync<RoadmapAccessDeniedException>();
        }

        [Fact]
        public async Task ChangeStatusAsync_WhenRoadmapIsDraft_ActivatesRoadmap()
        {
            var (roadmap, _, step) = await RoadmapGraphBuilder.SeedAsync(
                _context,
                UserId,
                lifecycle: LifecycleStatus.Draft
            );

            await _sut.ChangeStatusAsync(step.Id, UserId, StepStatus.InProgress);

            _context.ChangeTracker.Clear();
            var reloaded = await _context.Roadmaps.SingleAsync(r => r.Id == roadmap.Id);
            reloaded.LifecycleStatus.Should().Be(LifecycleStatus.Active);
        }

        // ---------- AddStepAsync ----------

        [Fact]
        public async Task AddStepAsync_WhenPhaseMissing_ThrowsPhaseNotFound()
        {
            await _sut.Invoking(s =>
                    s.AddStepAsync(
                        Guid.NewGuid(),
                        UserId,
                        null,
                        "t",
                        "s",
                        null,
                        null,
                        StepType.Required
                    )
                )
                .Should()
                .ThrowAsync<RoadmapPhaseNotFoundException>();
        }

        [Fact]
        public async Task AddStepAsync_WhenPhaseHas20Steps_ThrowsLimitReached()
        {
            var (_, phase, _) = await RoadmapGraphBuilder.SeedAsync(
                _context,
                UserId,
                stepCount: 20
            );

            await _sut.Invoking(s =>
                    s.AddStepAsync(phase.Id, UserId, null, "t", "s", null, null, StepType.Required)
                )
                .Should()
                .ThrowAsync<PhaseStepLimitReachedException>();
        }

        [Fact]
        public async Task AddStepAsync_WhenOwner_AppendsStepWithNextOrderIndex()
        {
            var (_, phase, _) = await RoadmapGraphBuilder.SeedAsync(_context, UserId, stepCount: 2);

            var created = await _sut.AddStepAsync(
                phase.Id,
                UserId,
                null,
                "New step",
                "sub",
                "desc",
                new List<string> { "topic" },
                StepType.Optional
            );

            created.OrderIndex.Should().Be(2);
            created.StepType.Should().Be(StepType.Optional);
            _context.ChangeTracker.Clear();
            (await _context.RoadmapSteps.CountAsync()).Should().Be(3);
        }

        // ---------- UpdateStepAsync ----------

        [Fact]
        public async Task UpdateStepAsync_AppliesOnlyProvidedFields()
        {
            var (_, _, step) = await RoadmapGraphBuilder.SeedAsync(_context, UserId);

            var updated = await _sut.UpdateStepAsync(
                step.Id,
                UserId,
                title: "Updated title",
                subtitle: null,
                description: "Updated description",
                topics: null,
                stepType: StepType.Optional
            );

            updated.Title.Should().Be("Updated title");
            updated.Description.Should().Be("Updated description");
            updated.StepType.Should().Be(StepType.Optional);
        }

        // ---------- DeleteStepAsync ----------

        [Fact]
        public async Task DeleteStepAsync_WhenPhaseHasSingleStep_RemovesPhaseToo()
        {
            var (_, phase, step) = await RoadmapGraphBuilder.SeedAsync(
                _context,
                UserId,
                stepCount: 1
            );

            await _sut.DeleteStepAsync(step.Id, UserId);

            _context.ChangeTracker.Clear();
            (await _context.RoadmapSteps.AnyAsync()).Should().BeFalse();
            (await _context.RoadmapPhases.AnyAsync(p => p.Id == phase.Id)).Should().BeFalse();
        }

        [Fact]
        public async Task DeleteStepAsync_ReparentsChildStepsToDeletedStepsParent()
        {
            var (_, phase, parent) = await RoadmapGraphBuilder.SeedAsync(
                _context,
                UserId,
                stepCount: 1
            );
            var middle = new RoadmapStep
            {
                Id = Guid.NewGuid(),
                PhaseId = phase.Id,
                Title = "middle",
                Subtitle = "s",
                ParentStepId = parent.Id,
                OrderIndex = 1,
            };
            var child = new RoadmapStep
            {
                Id = Guid.NewGuid(),
                PhaseId = phase.Id,
                Title = "child",
                Subtitle = "s",
                ParentStepId = middle.Id,
                OrderIndex = 2,
            };
            _context.RoadmapSteps.AddRange(middle, child);
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();

            await _sut.DeleteStepAsync(middle.Id, UserId);

            _context.ChangeTracker.Clear();
            var reloadedChild = await _context.RoadmapSteps.SingleAsync(s => s.Id == child.Id);
            reloadedChild.ParentStepId.Should().Be(parent.Id);
        }

        // ---------- UpdateStepPositionAsync ----------

        [Fact]
        public async Task UpdateStepPositionAsync_PersistsCoordinatesForOwnedSteps()
        {
            var (_, _, step) = await RoadmapGraphBuilder.SeedAsync(_context, UserId);
            var positions = new Dictionary<Guid, (double x, double y)> { [step.Id] = (12.5, 42.0) };

            await _sut.UpdateStepPositionAsync(UserId, positions);

            _context.ChangeTracker.Clear();
            var reloaded = await _context.RoadmapSteps.SingleAsync();
            reloaded.PositionX.Should().Be(12.5);
            reloaded.PositionY.Should().Be(42.0);
        }

        [Fact]
        public async Task UpdateStepPositionAsync_WhenAnyStepNotOwned_ThrowsAccessDenied()
        {
            var (_, _, step) = await RoadmapGraphBuilder.SeedAsync(_context, "other");
            var positions = new Dictionary<Guid, (double x, double y)> { [step.Id] = (1, 1) };

            await _sut.Invoking(s => s.UpdateStepPositionAsync(UserId, positions))
                .Should()
                .ThrowAsync<RoadmapAccessDeniedException>();
        }
    }
}
