using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Pgvector;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Repositories.Implementations;
using VocareWebAPI.JobOffers.Services.Implementations;
using VocareWebAPI.JobOffers.Services.Interfaces;
using VocareWebAPI.Shared.Services.Interfaces;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>
    /// Testy soft delete ofert w <see cref="JobOfferSyncService.SyncOffersAsync"/>:
    /// oferta oznaczona jako nieaktywna, która wraca do feedu, musi zostać reaktywowana.
    /// Dezaktywacja i purge (<c>ExecuteUpdate</c>/<c>ExecuteDelete</c>) wymagają PostgreSQL
    /// i nie są tu pokryte.
    /// </summary>
    public sealed class JobOfferSyncServiceSoftDeleteTests : IDisposable
    {
        private const JobOfferSource Source = JobOfferSource.NofluffJobs;
        private static readonly DateTime PublishedAt = new(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

        private readonly string _databaseName = Guid.NewGuid().ToString();
        private readonly AppDbContext _context;
        private readonly Mock<IEmbeddingService> _embeddingService = new();

        public JobOfferSyncServiceSoftDeleteTests()
        {
            _context = TestDbContextFactory.CreateContext(_databaseName);
            _embeddingService
                .Setup(s => s.GenerateEmbeddingAsync(It.IsAny<string>()))
                .ReturnsAsync(new Vector(new float[] { 0.1f, 0.2f }));
        }

        public void Dispose() => _context.Dispose();

        private static JobOffer Offer(string reference = "NFJ-1") =>
            new()
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = reference,
                Source = Source,
                Title = "Backend Developer",
                CompanyName = "Acme",
                Description = "Budowa API",
                PublishedAt = PublishedAt,
            };

        private async Task SeedAsync(JobOffer offer)
        {
            _context.JobOffers.Add(offer);
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
        }

        private JobOfferSyncService CreateSut(params JobOffer[] feed) =>
            new(
                new JobOfferRepository(_context),
                NullLogger<JobOfferSyncService>.Instance,
                _embeddingService.Object,
                new IJobOfferProvider[] { new FakeProvider(Source, feed) }
            );

        private async Task<JobOffer> ReloadAsync(string reference)
        {
            await using var fresh = TestDbContextFactory.CreateContext(_databaseName);
            return await fresh.JobOffers.SingleAsync(o => o.ReferenceNumber == reference);
        }

        [Fact]
        public async Task SyncOffersAsync_InactiveOfferReturnsWithIdenticalContent_ReactivatesIt()
        {
            var stored = Offer();
            stored.IsActive = false;
            stored.DeactivatedAt = DateTime.UtcNow.AddDays(-7);
            stored.Embedding = null;
            await SeedAsync(stored);

            var result = await CreateSut(Offer()).SyncOffersAsync();

            result.Updated.Should().Be(1);
            result.Skipped.Should().Be(0);
            var saved = await ReloadAsync("NFJ-1");
            saved.IsActive.Should().BeTrue();
            saved.DeactivatedAt.Should().BeNull();
            saved.Embedding.Should().NotBeNull();
        }

        [Fact]
        public async Task SyncOffersAsync_ActiveOfferWithIdenticalContent_IsSkipped()
        {
            var stored = Offer();
            stored.Embedding = new Vector(new float[] { 0.5f });
            await SeedAsync(stored);

            var result = await CreateSut(Offer()).SyncOffersAsync();

            result.Skipped.Should().Be(1);
            result.Updated.Should().Be(0);
            _embeddingService.Verify(s => s.GenerateEmbeddingAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task SyncOffersAsync_NewOffer_IsStoredAsActive()
        {
            await CreateSut(Offer("NFJ-2")).SyncOffersAsync();

            var saved = await ReloadAsync("NFJ-2");
            saved.IsActive.Should().BeTrue();
            saved.DeactivatedAt.Should().BeNull();
        }

        private sealed class FakeProvider(JobOfferSource source, IReadOnlyList<JobOffer> offers)
            : IJobOfferProvider
        {
            public JobOfferSource Source { get; } = source;

            public async IAsyncEnumerable<JobOffer> FetchOffersAsync(
                [EnumeratorCancellation] CancellationToken cancellationToken = default
            )
            {
                foreach (var offer in offers)
                {
                    yield return offer;
                }
                await Task.CompletedTask;
            }
        }
    }
}
