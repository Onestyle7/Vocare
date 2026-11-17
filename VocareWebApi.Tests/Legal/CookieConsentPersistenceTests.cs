using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.Legal.Configuration;
using VocareWebAPI.Legal.Jobs;
using VocareWebAPI.Legal.Models.Entities;
using VocareWebAPI.Legal.Models.Enums;
using VocareWebAPI.Legal.Repositories.Implementations;
using VocareWebAPI.Legal.Repositories.Interfaces;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.Legal
{
    /// <summary>
    /// Storage of cookie consent records: what the table holds, appending,
    /// and the retention cleanup job.
    /// </summary>
    public sealed class CookieConsentPersistenceTests
    {
        private static CookieConsentRecord Record(DateTime createdAt) =>
            new()
            {
                Id = Guid.NewGuid(),
                ConsentId = Guid.NewGuid(),
                AnalyticsGranted = true,
                AdsGranted = true,
                Source = CookieConsentSource.Banner,
                TextVersion = "2026-11-13",
                CreatedAt = createdAt,
            };

        [Fact]
        public void Model_DoesNotStoreIpAddressOrUserAgent()
        {
            using var context = TestDbContextFactory.CreateContext();

            var columns = context
                .Model.FindEntityType(typeof(CookieConsentRecord))!
                .GetProperties()
                .Select(p => p.Name);

            columns
                .Should()
                .BeEquivalentTo(
                    nameof(CookieConsentRecord.Id),
                    nameof(CookieConsentRecord.ConsentId),
                    nameof(CookieConsentRecord.UserId),
                    nameof(CookieConsentRecord.AnalyticsGranted),
                    nameof(CookieConsentRecord.AdsGranted),
                    nameof(CookieConsentRecord.Source),
                    nameof(CookieConsentRecord.TextVersion),
                    nameof(CookieConsentRecord.CreatedAt)
                );
        }

        [Fact]
        public async Task Repository_AddCookieConsentRecord_PersistsRecord()
        {
            var databaseName = Guid.NewGuid().ToString();
            var record = Record(DateTime.UtcNow);

            await using (var context = TestDbContextFactory.CreateContext(databaseName))
            {
                await new LegalRepository(context).AddCookieConsentRecordAsync(record);
            }

            await using var verify = TestDbContextFactory.CreateContext(databaseName);
            var stored = await verify.CookieConsentRecords.SingleAsync();
            stored.Id.Should().Be(record.Id);
            stored.UserId.Should().BeNull();
        }

        [Fact]
        public async Task Repository_DeleteOlderThan_RemovesOnlyRecordsBeforeCutoff()
        {
            var databaseName = Guid.NewGuid().ToString();
            var cutoff = new DateTime(2023, 11, 15, 3, 0, 0, DateTimeKind.Utc);
            var expired = Record(cutoff.AddSeconds(-1));
            var atCutoff = Record(cutoff);
            var recent = Record(cutoff.AddDays(1));

            await using (var seed = TestDbContextFactory.CreateContext(databaseName))
            {
                seed.CookieConsentRecords.AddRange(expired, atCutoff, recent);
                await seed.SaveChangesAsync();
            }

            int deleted;
            await using (var context = TestDbContextFactory.CreateContext(databaseName))
            {
                deleted = await new LegalRepository(
                    context
                ).DeleteCookieConsentRecordsOlderThanAsync(cutoff);
            }

            deleted.Should().Be(1);
            await using var verify = TestDbContextFactory.CreateContext(databaseName);
            (await verify.CookieConsentRecords.Select(r => r.Id).ToListAsync())
                .Should()
                .BeEquivalentTo([atCutoff.Id, recent.Id]);
        }

        [Fact]
        public async Task CleanupJob_UsesConfiguredRetentionPeriod()
        {
            var repository = new Mock<ILegalRepository>();
            DateTime? cutoff = null;
            repository
                .Setup(r => r.DeleteCookieConsentRecordsOlderThanAsync(It.IsAny<DateTime>()))
                .Callback<DateTime>(c => cutoff = c)
                .ReturnsAsync(0);
            var job = new CookieConsentCleanupJob(
                repository.Object,
                Options.Create(new CookieConsentConfig { RetentionYears = 3 }),
                NullLogger<CookieConsentCleanupJob>.Instance
            );

            await job.ExecuteAsync();

            cutoff.Should().NotBeNull();
            cutoff!.Value.Should().BeCloseTo(DateTime.UtcNow.AddYears(-3), TimeSpan.FromMinutes(1));
            cutoff.Value.Kind.Should().Be(DateTimeKind.Utc);
        }
    }
}
