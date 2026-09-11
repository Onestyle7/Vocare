using System;
using System.Threading.Tasks;
using FluentAssertions;
using VocareWebAPI.Data;
using VocareWebAPI.MarketNews.Models.Entities;
using VocareWebAPI.MarketNews.Repositories.Implementations;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.MarketNews
{
    /// <summary>Testy jednostkowe <see cref="MarketNewsRepository"/> (dostawca InMemory).</summary>
    public sealed class MarketNewsRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly MarketNewsRepository _sut;

        public MarketNewsRepositoryTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new MarketNewsRepository(_context);
        }

        public void Dispose() => _context.Dispose();

        private async Task SeedAsync(params DateTime[] createdAtValues)
        {
            foreach (var createdAt in createdAtValues)
            {
                _context.MarketNews.Add(
                    new MarketNewsEntity
                    {
                        Id = Guid.NewGuid(),
                        Title = "t",
                        Summary = "s",
                        Content = "c",
                        CreatedAt = createdAt,
                    }
                );
            }
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
        }

        [Fact]
        public async Task GetLatest3Async_ReturnsThreeNewestByCreatedAt()
        {
            await SeedAsync(
                new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc)
            );

            var result = await _sut.GetLatest3Async();

            result.Should().HaveCount(3);
            result[0].CreatedAt.Should().Be(new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc));
        }

        [Fact]
        public async Task GetLatestAsync_ReturnsNewest()
        {
            await SeedAsync(
                new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc)
            );

            (await _sut.GetLatestAsync())!
                .CreatedAt.Should()
                .Be(new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc));
        }

        [Fact]
        public async Task GetAllPagedAsync_ReturnsPageAndTotalCount()
        {
            await SeedAsync(
                new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc)
            );

            var (news, total) = await _sut.GetAllPagedAsync(page: 2, pageSize: 2);

            total.Should().Be(3);
            news.Should().ContainSingle();
        }

        [Fact]
        public async Task ExistsForDateAsync_MatchesByCalendarDay()
        {
            await SeedAsync(new DateTime(2026, 3, 15, 8, 30, 0, DateTimeKind.Utc));

            (await _sut.ExistsForDateAsync(new DateTime(2026, 3, 15, 23, 0, 0, DateTimeKind.Utc)))
                .Should()
                .BeTrue();
            (await _sut.ExistsForDateAsync(new DateTime(2026, 3, 16, 0, 0, 0, DateTimeKind.Utc)))
                .Should()
                .BeFalse();
        }

        [Fact]
        public async Task AddAsync_PersistsAndReturnsEntity()
        {
            var entity = new MarketNewsEntity
            {
                Id = Guid.NewGuid(),
                Title = "t",
                Summary = "s",
                Content = "c",
            };

            var result = await _sut.AddAsync(entity);

            result.Id.Should().Be(entity.Id);
            (await _sut.GetByIdAsync(entity.Id)).Should().NotBeNull();
        }
    }
}
