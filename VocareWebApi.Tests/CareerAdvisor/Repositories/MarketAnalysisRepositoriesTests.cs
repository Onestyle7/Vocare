using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.CareerAdvisor.Models.Entities.MarketAnalysis;
using VocareWebAPI.CareerAdvisor.Repositories.Implementations;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities.MarketAnalysis;
using VocareWebAPI.Repositories.Implementations;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.CareerAdvisor.Repositories
{
    /// <summary>
    /// Testy jednostkowe repozytoriów analizy rynku (dostawca InMemory) – dodawanie, filtrowanie
    /// po kluczu obcym i usuwanie powiązanych rekordów.
    /// </summary>
    public sealed class MarketAnalysisRepositoriesTests : IDisposable
    {
        private readonly AppDbContext _context;

        public MarketAnalysisRepositoriesTests()
        {
            _context = TestDbContextFactory.CreateContext();
        }

        public void Dispose() => _context.Dispose();

        // ---------- Repozytoria powiązane z AiRecommendationId ----------

        [Fact]
        public async Task CareerStatisticsRepository_AddGetDelete_ScopedByRecommendation()
        {
            var sut = new CareerStatisticsRepository(_context);
            var recId = Guid.NewGuid();
            await sut.AddAsync(
                new CareerStatistics
                {
                    Id = Guid.NewGuid(),
                    CareerName = "Backend",
                    AiRecommendationId = recId,
                    LastUpdated = DateTime.UtcNow,
                }
            );
            await sut.AddAsync(
                new CareerStatistics
                {
                    Id = Guid.NewGuid(),
                    CareerName = "Other",
                    AiRecommendationId = Guid.NewGuid(),
                    LastUpdated = DateTime.UtcNow,
                }
            );

            (await sut.GetByAiRecommendationIdAsync(recId)).Should().ContainSingle();

            await sut.DeleteByAiRecommendationIdAsync(recId);
            (await sut.GetByAiRecommendationIdAsync(recId)).Should().BeEmpty();
            (await _context.CareerStatistics.CountAsync()).Should().Be(1);
        }

        [Fact]
        public async Task SkillDemandRepository_AddGetDelete_ScopedByRecommendation()
        {
            var sut = new SkillDemandRepository(_context);
            var recId = Guid.NewGuid();
            await sut.AddAsync(
                new SkillDemand
                {
                    Id = Guid.NewGuid(),
                    SkillName = "C#",
                    AiRecommendationId = recId,
                    LastUpdated = DateTime.UtcNow,
                }
            );

            (await sut.GetByAiRecommendationIdAsync(recId)).Should().ContainSingle();
            await sut.DeleteByAiRecommendationIdAsync(recId);
            (await sut.GetByAiRecommendationIdAsync(recId)).Should().BeEmpty();
        }

        [Fact]
        public async Task MarketTrendsRepository_AddGetDelete_ScopedByRecommendation()
        {
            var sut = new MarketTrendsRepository(_context);
            var recId = Guid.NewGuid();
            await sut.AddAsync(
                new MarketTrends
                {
                    Id = Guid.NewGuid(),
                    TrendName = "Return to office",
                    AiRecommendationId = recId,
                }
            );

            (await sut.GetByAiRecommendationIdAsync(recId)).Should().ContainSingle();
            await sut.DeleteByAiRecommendationIdAsync(recId);
            (await sut.GetByAiRecommendationIdAsync(recId)).Should().BeEmpty();
        }

        // ---------- Repozytoria powiązane z CareerStatisticsId ----------

        [Fact]
        public async Task SalaryProgressionRepository_AddGetDelete_OrdersByMaxSalary()
        {
            var sut = new SalaryProgressionRepository(_context);
            var statId = Guid.NewGuid();
            await sut.AddAsync(
                new SalaryProgression
                {
                    Id = Guid.NewGuid(),
                    CareerLevel = "Senior",
                    MaxSalary = 18000,
                    CareerStatisticsId = statId,
                }
            );
            await sut.AddAsync(
                new SalaryProgression
                {
                    Id = Guid.NewGuid(),
                    CareerLevel = "Junior",
                    MaxSalary = 7000,
                    CareerStatisticsId = statId,
                }
            );

            var result = await sut.GetByCareerStatisticsIdAsync(statId);
            result.Select(r => r.CareerLevel).Should().ContainInOrder("Junior", "Senior");

            await sut.DeleteByCareerStatisticsIdAsync(statId);
            (await sut.GetByCareerStatisticsIdAsync(statId)).Should().BeEmpty();
        }

        [Fact]
        public async Task WorkAttributesRepository_AddGetDelete_ScopedByCareerStatistics()
        {
            var sut = new WorkAttributesRepository(_context);
            var statId = Guid.NewGuid();
            await sut.AddAsync(
                new WorkAttributes
                {
                    Id = Guid.NewGuid(),
                    StressLevel = 7,
                    CareerStatisticsId = statId,
                }
            );

            (await sut.GetByCareerStatisticsIdAsync(statId))!.StressLevel.Should().Be(7);
            await sut.DeleteByCareerStatisticsIdAsync(statId);
            (await sut.GetByCareerStatisticsIdAsync(statId)).Should().BeNull();
        }

        [Fact]
        public async Task EntryDifficultyRepository_AddGetDelete_PersistsMissingSkillsList()
        {
            var sut = new EntryDifficultyRepository(_context);
            var statId = Guid.NewGuid();
            await sut.AddAsync(
                new EntryDifficulty
                {
                    Id = Guid.NewGuid(),
                    DifficultyScore = 65,
                    MissingSkills = new List<string> { "React", "TypeScript" },
                    CareerStatisticsId = statId,
                }
            );
            _context.ChangeTracker.Clear();

            var stored = await sut.GetByCareerStatisticsIdAsync(statId);
            stored!.MissingSkills.Should().BeEquivalentTo(new[] { "React", "TypeScript" });

            await sut.DeleteByCareerStatisticsIdAsync(statId);
            (await sut.GetByCareerStatisticsIdAsync(statId)).Should().BeNull();
        }

        [Fact]
        public async Task AiNarratorRepository_AddGetDelete_ScopedByCareerStatistics()
        {
            var sut = new AiNarratorRepository(_context);
            var statId = Guid.NewGuid();
            await sut.AddAsync(
                new AiNarrator
                {
                    Id = Guid.NewGuid(),
                    SalaryInsight = "Grows fast",
                    CareerStatisticsId = statId,
                }
            );

            (await sut.GetByCareerStatisticsIdAsync(statId))!
                .SalaryInsight.Should()
                .Be("Grows fast");
            await sut.DeleteByCareerStatisticsIdAsync(statId);
            (await sut.GetByCareerStatisticsIdAsync(statId)).Should().BeNull();
        }
    }
}
