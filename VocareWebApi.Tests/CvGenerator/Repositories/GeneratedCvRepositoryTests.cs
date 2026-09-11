using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Repositories.Implementations;
using VocareWebAPI.Data;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.CvGenerator.Repositories
{
    /// <summary>Testy jednostkowe <see cref="GeneratedCvrepository"/> (dostawca InMemory).</summary>
    public sealed class GeneratedCvRepositoryTests : IDisposable
    {
        private const string UserId = "user-123";

        private readonly AppDbContext _context;
        private readonly GeneratedCvrepository _sut;

        public GeneratedCvRepositoryTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new GeneratedCvrepository(_context, NullLogger<GeneratedCvrepository>.Instance);
        }

        public void Dispose() => _context.Dispose();

        private static GeneratedCv NewCv(string userId = UserId, string name = "CV") =>
            new()
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = name,
                CvJson = "{}",
            };

        [Fact]
        public async Task AddAsync_StampsTechnicalFieldsAndPersists()
        {
            var saved = await _sut.AddAsync(NewCv());

            saved.Version.Should().Be(1);
            saved.IsActive.Should().BeTrue();
            _context.ChangeTracker.Clear();
            (await _context.GeneratedCvs.CountAsync()).Should().Be(1);
        }

        [Fact]
        public async Task GetByIdAsync_IgnoresInactiveCvs()
        {
            var cv = NewCv();
            await _sut.AddAsync(cv);
            await _sut.DeactivateAsync(cv.Id);
            _context.ChangeTracker.Clear();

            (await _sut.GetByIdAsync(cv.Id)).Should().BeNull();
        }

        [Fact]
        public async Task GetUserCvsAsync_ReturnsActiveCvsWithDefaultFirst()
        {
            var normal = NewCv(name: "normal");
            var main = NewCv(name: "main");
            await _sut.AddAsync(normal);
            await _sut.AddAsync(main);
            await _sut.SetDefaultAsync(main.Id, UserId);
            _context.ChangeTracker.Clear();

            var result = await _sut.GetUserCvsAsync(UserId);

            result.Should().HaveCount(2);
            result[0].Name.Should().Be("main");
        }

        [Fact]
        public async Task GetUserCvCountAsync_CountsOnlyActiveCvsForUser()
        {
            await _sut.AddAsync(NewCv());
            await _sut.AddAsync(NewCv("other-user"));

            (await _sut.GetUserCvCountAsync(UserId)).Should().Be(1);
        }

        [Fact]
        public async Task UpdateAsync_BumpsVersionAndModificationTimestamp()
        {
            var cv = await _sut.AddAsync(NewCv());
            _context.ChangeTracker.Clear();
            var reloaded = await _sut.GetByIdAsync(cv.Id);

            reloaded!.Name = "Renamed";
            await _sut.UpdateAsync(reloaded);

            reloaded.Version.Should().Be(2);
        }

        [Fact]
        public async Task SetDefaultAsync_MakesExactlyOneCvDefault()
        {
            var first = NewCv();
            var second = NewCv();
            await _sut.AddAsync(first);
            await _sut.AddAsync(second);

            await _sut.SetDefaultAsync(first.Id, UserId);
            await _sut.SetDefaultAsync(second.Id, UserId);
            _context.ChangeTracker.Clear();

            var cvs = await _sut.GetUserCvsAsync(UserId);
            cvs.Count(c => c.IsDefault).Should().Be(1);
            cvs.Single(c => c.IsDefault).Id.Should().Be(second.Id);
        }

        [Fact]
        public async Task BelongsToUserAsync_TrueOnlyForOwnersActiveCv()
        {
            var cv = await _sut.AddAsync(NewCv());

            (await _sut.BelongsToUserAsync(cv.Id, UserId)).Should().BeTrue();
            (await _sut.BelongsToUserAsync(cv.Id, "intruder")).Should().BeFalse();
        }

        [Fact]
        public async Task DeactivateAsync_WhenCvMissing_ReturnsFalse()
        {
            (await _sut.DeactivateAsync(Guid.NewGuid())).Should().BeFalse();
        }
    }
}
