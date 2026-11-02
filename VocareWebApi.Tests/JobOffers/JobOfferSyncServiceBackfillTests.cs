using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Pgvector;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Repositories.Implementations;
using VocareWebAPI.JobOffers.Services.Implementations;
using VocareWebAPI.JobOffers.Services.Interfaces;
using VocareWebAPI.Shared.Services.Interfaces;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>
    /// Testy <see cref="JobOfferSyncService.BackfillEmbeddingsAsync"/> – uzupełnianie brakujących embeddingów.
    /// </summary>
    public sealed class JobOfferSyncServiceBackfillTests : IDisposable
    {
        private readonly string _databaseName = Guid.NewGuid().ToString();
        private readonly AppDbContext _context;
        private readonly Mock<IEmbeddingService> _embeddingService = new();
        private readonly List<string> _embeddedTexts = new();
        private readonly JobOfferSyncService _sut;

        public JobOfferSyncServiceBackfillTests()
        {
            _context = TestDbContextFactory.CreateContext(_databaseName);
            _embeddingService
                .Setup(s => s.GenerateEmbeddingAsync(It.IsAny<string>()))
                .Callback<string>(_embeddedTexts.Add)
                .ReturnsAsync(new Vector(new float[] { 0.1f, 0.2f }));
            _sut = new JobOfferSyncService(
                new JobOfferRepository(_context),
                NullLogger<JobOfferSyncService>.Instance,
                _embeddingService.Object,
                Array.Empty<IJobOfferProvider>()
            );
        }

        public void Dispose() => _context.Dispose();

        private async Task<Guid> SeedOfferWithoutEmbeddingAsync()
        {
            var offer = new JobOffer
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "NFJ-1",
                Title = "Backend Developer",
                Description = "<p>Budowa <b>API</b></p>",
                Embedding = null,
                Skills = new List<JobOfferSkill>
                {
                    new() { Id = Guid.NewGuid(), Name = "C#" },
                },
            };
            _context.JobOffers.Add(offer);
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
            return offer.Id;
        }

        [Fact]
        public async Task BackfillEmbeddingsAsync_PersistsGeneratedEmbedding()
        {
            var offerId = await SeedOfferWithoutEmbeddingAsync();

            var result = await _sut.BackfillEmbeddingsAsync(10);

            result.Processed.Should().Be(1);
            result.Remaining.Should().Be(0);
            await using var freshContext = TestDbContextFactory.CreateContext(_databaseName);
            var saved = await freshContext.JobOffers.SingleAsync(o => o.Id == offerId);
            saved.Embedding.Should().NotBeNull();
        }

        [Fact]
        public async Task BackfillEmbeddingsAsync_BuildsTextFromPlainDescriptionAndSkills()
        {
            await SeedOfferWithoutEmbeddingAsync();

            await _sut.BackfillEmbeddingsAsync(10);

            _embeddedTexts
                .Should()
                .ContainSingle()
                .Which.Should()
                .Be("Backend Developer. Budowa API. Wymagane umiejętności: C#");
        }
    }
}
