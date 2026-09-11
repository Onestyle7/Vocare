using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.RoadmapService.Exceptions;
using VocareWebAPI.RoadmapService.Services.Implementations;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.RoadmapService
{
    /// <summary>Testy jednostkowe <see cref="RoadmapPhaseService"/> (dostawca InMemory).</summary>
    public sealed class RoadmapPhaseServiceTests : IDisposable
    {
        private const string UserId = "user-123";

        private readonly AppDbContext _context;
        private readonly RoadmapPhaseService _sut;

        public RoadmapPhaseServiceTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new RoadmapPhaseService(_context);
        }

        public void Dispose() => _context.Dispose();

        [Fact]
        public async Task UpdateNameAsync_WithBlankUserId_ThrowsArgumentException()
        {
            await _sut.Invoking(s => s.UpdateNameAsync(Guid.NewGuid(), "", "x"))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task UpdateNameAsync_WhenPhaseMissing_ThrowsPhaseNotFound()
        {
            await _sut.Invoking(s => s.UpdateNameAsync(Guid.NewGuid(), UserId, "x"))
                .Should()
                .ThrowAsync<RoadmapPhaseNotFoundException>();
        }

        [Fact]
        public async Task UpdateNameAsync_WhenRoadmapOwnedByAnotherUser_ThrowsAccessDenied()
        {
            var (_, phase, _) = await RoadmapGraphBuilder.SeedAsync(_context, "other-user");

            await _sut.Invoking(s => s.UpdateNameAsync(phase.Id, UserId, "x"))
                .Should()
                .ThrowAsync<RoadmapAccessDeniedException>();
        }

        [Fact]
        public async Task UpdateNameAsync_WhenOwner_RenamesPhase()
        {
            var (_, phase, _) = await RoadmapGraphBuilder.SeedAsync(_context, UserId);

            var result = await _sut.UpdateNameAsync(phase.Id, UserId, "Renamed phase");

            result.Title.Should().Be("Renamed phase");
            _context.ChangeTracker.Clear();
            (await _context.RoadmapPhases.SingleAsync()).Title.Should().Be("Renamed phase");
        }

        [Fact]
        public async Task DeletePhaseAsync_WhenOwner_RemovesPhase()
        {
            var (_, phase, _) = await RoadmapGraphBuilder.SeedAsync(_context, UserId);

            await _sut.DeletePhaseAsync(phase.Id, UserId);

            _context.ChangeTracker.Clear();
            (await _context.RoadmapPhases.AnyAsync()).Should().BeFalse();
        }

        [Fact]
        public async Task DeletePhaseAsync_WhenNotOwner_ThrowsAccessDenied()
        {
            var (_, phase, _) = await RoadmapGraphBuilder.SeedAsync(_context, "other-user");

            await _sut.Invoking(s => s.DeletePhaseAsync(phase.Id, UserId))
                .Should()
                .ThrowAsync<RoadmapAccessDeniedException>();
        }
    }
}
