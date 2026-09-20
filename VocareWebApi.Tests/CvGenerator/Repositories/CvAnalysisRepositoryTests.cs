using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using VocareWebAPI.CvGenerator.Models.Entities;
using VocareWebAPI.CvGenerator.Repositories.Implementations;
using VocareWebAPI.Data;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.CvGenerator.Repositories
{
    /// <summary>Testy jednostkowe <see cref="CvAnalysisRepository"/> (dostawca InMemory).</summary>
    public sealed class CvAnalysisRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly CvAnalysisRepository _sut;

        public CvAnalysisRepositoryTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new CvAnalysisRepository(_context, NullLogger<CvAnalysisRepository>.Instance);
        }

        public void Dispose() => _context.Dispose();

        [Fact]
        public async Task SaveAsync_WhenNoAnalysisExists_InsertsNewRow()
        {
            var cvId = Guid.NewGuid();

            await _sut.SaveAsync(
                new CvAnalysis
                {
                    Id = Guid.NewGuid(),
                    CvId = cvId,
                    ResultJson = "{\"overallScore\":50}",
                    CvVersionAtAnalysis = 1,
                }
            );

            _context.ChangeTracker.Clear();
            var stored = await _sut.GetByCvIdAsync(cvId);
            stored.Should().NotBeNull();
            stored!.CvVersionAtAnalysis.Should().Be(1);
        }

        [Fact]
        public async Task SaveAsync_WhenAnalysisExists_UpdatesInPlace()
        {
            var cvId = Guid.NewGuid();
            await _sut.SaveAsync(
                new CvAnalysis
                {
                    Id = Guid.NewGuid(),
                    CvId = cvId,
                    ResultJson = "{\"overallScore\":50}",
                    CvVersionAtAnalysis = 1,
                }
            );
            _context.ChangeTracker.Clear();

            await _sut.SaveAsync(
                new CvAnalysis
                {
                    Id = Guid.NewGuid(),
                    CvId = cvId,
                    ResultJson = "{\"overallScore\":90}",
                    CvVersionAtAnalysis = 2,
                }
            );

            _context.ChangeTracker.Clear();
            (await _context.CvAnalyses.CountAsync()).Should().Be(1);
            var stored = await _sut.GetByCvIdAsync(cvId);
            stored!.ResultJson.Should().Contain("90");
            stored.CvVersionAtAnalysis.Should().Be(2);
        }

        [Fact]
        public async Task GetByCvIdAsync_WhenMissing_ReturnsNull()
        {
            (await _sut.GetByCvIdAsync(Guid.NewGuid())).Should().BeNull();
        }
    }
}
