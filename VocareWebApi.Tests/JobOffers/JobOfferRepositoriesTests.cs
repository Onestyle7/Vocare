using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Pgvector;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Repositories.Implementations;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>
    /// Testy jednostkowe repozytoriów modułu JobOffers (dostawca InMemory):
    /// <see cref="JobOfferRepository"/> i <see cref="SkillEmbeddingRepository"/>.
    /// Metody oparte o <c>ExecuteDelete</c>/wyszukiwanie wektorowe pominięto – wymagają PostgreSQL.
    /// </summary>
    public sealed class JobOfferRepositoriesTests : IDisposable
    {
        private readonly AppDbContext _context;

        public JobOfferRepositoriesTests()
        {
            _context = TestDbContextFactory.CreateContext();
        }

        public void Dispose() => _context.Dispose();

        private static JobOffer Offer(
            string reference = "ref-1",
            JobOfferSource source = JobOfferSource.NofluffJobs,
            Vector? embedding = null,
            params string[] skills
        ) =>
            new()
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = reference,
                Title = "Backend Developer",
                Source = source,
                Embedding = embedding,
                UpdatedAt = DateTime.UtcNow,
                Skills = skills
                    .Select(s => new JobOfferSkill { Id = Guid.NewGuid(), Name = s })
                    .ToList(),
            };

        // ---------- JobOfferRepository ----------

        [Fact]
        public async Task JobOfferRepository_GetByReferenceNumber_MatchesReferenceAndSource()
        {
            var sut = new JobOfferRepository(_context);
            await sut.AddAsync(Offer("ref-1", JobOfferSource.NofluffJobs));
            await sut.AddAsync(Offer("ref-1", JobOfferSource.SolidJobs));

            var result = await sut.GetByReferenceNumberAsync("ref-1", JobOfferSource.SolidJobs);

            result.Should().NotBeNull();
            result!.Source.Should().Be(JobOfferSource.SolidJobs);
        }

        private static JobOffer Inactive(JobOffer offer)
        {
            offer.IsActive = false;
            offer.DeactivatedAt = DateTime.UtcNow;
            return offer;
        }

        [Fact]
        public async Task JobOfferRepository_GetCountAsync_CountsOnlyActiveOffers()
        {
            var sut = new JobOfferRepository(_context);
            await sut.AddAsync(Offer("ref-1"));
            await sut.AddAsync(Offer("ref-2"));
            await sut.AddAsync(Inactive(Offer("ref-inactive")));

            (await sut.GetCountAsync()).Should().Be(2);
        }

        [Fact]
        public async Task JobOfferRepository_GetAllUniqueSkillNames_ExcludesSkillsOfInactiveOffers()
        {
            var sut = new JobOfferRepository(_context);
            await sut.AddAsync(Offer("ref-active", skills: new[] { "C#", "SQL" }));
            await sut.AddAsync(Inactive(Offer("ref-inactive", skills: new[] { "SQL", "Cobol" })));

            var names = await sut.GetAllUniqueSkillNamesAsync();

            names.Should().BeEquivalentTo(new[] { "C#", "SQL" });
        }

        [Fact]
        public void JobOfferModel_HasIndexOnIsActiveAndDeactivatedAt()
        {
            var indexes = _context
                .Model.FindEntityType(typeof(JobOffer))!
                .GetIndexes()
                .Select(i => i.Properties.Select(p => p.Name).ToArray());

            indexes
                .Should()
                .ContainEquivalentOf(
                    new[] { nameof(JobOffer.IsActive), nameof(JobOffer.DeactivatedAt) },
                    o => o.WithStrictOrdering()
                );
        }

        [Fact]
        public async Task JobOfferRepository_CountOffersWithoutEmbedding_ExcludesOffersWithEmbedding()
        {
            var sut = new JobOfferRepository(_context);
            await sut.AddAsync(Offer("ref-1", embedding: null));
            await sut.AddAsync(Offer("ref-2", embedding: new Vector(new float[] { 0.1f })));

            (await sut.CountOffersWithoutEmbeddingAsync()).Should().Be(1);
            (await sut.GetOffersWithoutEmbeddingAsync(10)).Should().ContainSingle();
        }

        [Fact]
        public async Task JobOfferRepository_OffersWithoutEmbedding_ExcludeInactiveOffers()
        {
            var sut = new JobOfferRepository(_context);
            var inactive = Offer("ref-inactive", embedding: null);
            inactive.IsActive = false;
            inactive.DeactivatedAt = DateTime.UtcNow;
            await sut.AddAsync(inactive);
            await sut.AddAsync(Offer("ref-active", embedding: null));

            (await sut.CountOffersWithoutEmbeddingAsync()).Should().Be(1);
            (await sut.GetOffersWithoutEmbeddingAsync(10))
                .Should()
                .ContainSingle()
                .Which.ReferenceNumber.Should()
                .Be("ref-active");
        }

        [Fact]
        public async Task JobOfferRepository_GetAllUniqueSkillNames_DeduplicatesAcrossOffers()
        {
            var sut = new JobOfferRepository(_context);
            await sut.AddAsync(Offer("ref-1", skills: new[] { "C#", "SQL" }));
            await sut.AddAsync(Offer("ref-2", skills: new[] { "SQL", "Docker" }));

            var names = await sut.GetAllUniqueSkillNamesAsync();

            names.Should().BeEquivalentTo(new[] { "C#", "SQL", "Docker" });
        }

        [Fact]
        public async Task JobOfferRepository_GetDetailsById_IncludesSkills()
        {
            var sut = new JobOfferRepository(_context);
            var offer = Offer("ref-1", skills: new[] { "C#" });
            await sut.AddAsync(offer);

            var details = await sut.GetDetailsByIdAsync(offer.Id);

            details!.Skills.Should().ContainSingle().Which.Name.Should().Be("C#");
        }

        [Fact]
        public async Task JobOfferRepository_GetAllReferenceNumbers_ReturnsStaleInfoForSource()
        {
            var sut = new JobOfferRepository(_context);
            await sut.AddAsync(Offer("ref-1", JobOfferSource.NofluffJobs));
            await sut.AddAsync(Offer("ref-2", JobOfferSource.SolidJobs));

            var info = (await sut.GetAllReferenceNumbersAsync(JobOfferSource.NofluffJobs)).ToList();

            info.Should().ContainSingle();
            info[0].ReferenceNumber.Should().Be("ref-1");
        }

        // ---------- SkillEmbeddingRepository ----------

        [Fact]
        public async Task SkillEmbeddingRepository_GetByNormalizedNames_ReturnsOnlyRequested()
        {
            var sut = new SkillEmbeddingRepository(
                _context,
                NullLogger<SkillEmbeddingRepository>.Instance
            );
            await sut.AddRangeAsync(
                new List<SkillEmbedding>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        NormalizedSkillName = "c#",
                        Embedding = new Vector(new float[] { 1f }),
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        NormalizedSkillName = "sql",
                        Embedding = new Vector(new float[] { 2f }),
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        NormalizedSkillName = "go",
                        Embedding = new Vector(new float[] { 3f }),
                    },
                }
            );

            var result = await sut.GetByNormalizedNamesAsync(new List<string> { "c#", "go" });

            result.Select(e => e.NormalizedSkillName).Should().BeEquivalentTo(new[] { "c#", "go" });
        }

        [Fact]
        public async Task SkillEmbeddingRepository_GetAllNormalizedNames_ReturnsEveryStoredName()
        {
            var sut = new SkillEmbeddingRepository(
                _context,
                NullLogger<SkillEmbeddingRepository>.Instance
            );
            await sut.AddAsync(
                new SkillEmbedding
                {
                    Id = Guid.NewGuid(),
                    NormalizedSkillName = "rust",
                    Embedding = new Vector(new float[] { 1f }),
                }
            );

            (await sut.GetAllNormalizedNamesAsync()).Should().Contain("rust");
        }
    }
}
