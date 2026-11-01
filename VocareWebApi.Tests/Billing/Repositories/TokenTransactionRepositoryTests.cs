using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Implementations;
using VocareWebAPI.Data;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.Billing.Repositories
{
    /// <summary>Testy jednostkowe <see cref="TokenTransactionRepository"/>.</summary>
    public sealed class TokenTransactionRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly TokenTransactionRepository _sut;

        public TokenTransactionRepositoryTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new TokenTransactionRepository(_context);
        }

        public void Dispose() => _context.Dispose();

        [Fact]
        public async Task AddTransactionAsync_PersistsTransaction()
        {
            var transaction = new TokenTransaction
            {
                UserId = "user-1",
                ServiceName = "AnalyzeProfile",
                Amount = -60,
                Type = TransactionType.Usage,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            };

            await _sut.AddTransactionAsync(transaction);

            _context.ChangeTracker.Clear();
            var stored = await _context.TokenTransactions.AsNoTracking().SingleAsync();
            stored.UserId.Should().Be("user-1");
            stored.Amount.Should().Be(-60);
            stored.Type.Should().Be(TransactionType.Usage);
        }

        [Fact]
        public async Task AddTransactionAsync_WhenCreatedAtNotSet_StampsCurrentUtc()
        {
            var transaction = new TokenTransaction
            {
                UserId = "user-1",
                ServiceName = "TokenPurchase",
                Amount = 50,
                Type = TransactionType.Purchase,
            };

            await _sut.AddTransactionAsync(transaction);

            transaction.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        }

        [Fact]
        public async Task AddTransactionAsync_WithNull_ThrowsArgumentNullException()
        {
            await _sut.Invoking(r => r.AddTransactionAsync(null!))
                .Should()
                .ThrowAsync<ArgumentNullException>();
        }

        [Fact]
        public async Task HasTransactionOfTypeAsync_WhenUserHasTransactionOfType_ReturnsTrue()
        {
            await SeedTransactionAsync("user-1", TransactionType.WelcomeBonus);

            (await _sut.HasTransactionOfTypeAsync("user-1", TransactionType.WelcomeBonus))
                .Should()
                .BeTrue();
        }

        [Fact]
        public async Task HasTransactionOfTypeAsync_WhenOnlyOtherTypesOrUsersMatch_ReturnsFalse()
        {
            await SeedTransactionAsync("user-1", TransactionType.Purchase);
            await SeedTransactionAsync("user-2", TransactionType.WelcomeBonus);

            (await _sut.HasTransactionOfTypeAsync("user-1", TransactionType.WelcomeBonus))
                .Should()
                .BeFalse();
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public async Task HasTransactionOfTypeAsync_WithBlankUserId_ThrowsArgumentException(
            string userId
        )
        {
            await _sut.Invoking(r => r.HasTransactionOfTypeAsync(userId, TransactionType.Usage))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        private async Task SeedTransactionAsync(string userId, TransactionType type)
        {
            _context.TokenTransactions.Add(
                new TokenTransaction
                {
                    UserId = userId,
                    ServiceName = type.ToString(),
                    Amount = 1,
                    Type = type,
                    CreatedAt = DateTime.UtcNow,
                }
            );
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public async Task AddTransactionAsync_WithBlankUserId_ThrowsArgumentException(string userId)
        {
            var transaction = new TokenTransaction
            {
                UserId = userId,
                ServiceName = "x",
                Amount = 1,
                Type = TransactionType.Purchase,
            };

            await _sut.Invoking(r => r.AddTransactionAsync(transaction))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        // ---------- HasEverHadSubscriptionAsync ----------

        private async Task SeedAsync(
            string userId,
            string serviceName,
            TransactionType type,
            DateTime? createdAt = null
        )
        {
            _context.TokenTransactions.Add(
                new TokenTransaction
                {
                    UserId = userId,
                    ServiceName = serviceName,
                    Amount = 0,
                    Type = type,
                    CreatedAt = createdAt ?? DateTime.UtcNow,
                }
            );
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
        }

        [Theory]
        [InlineData("SubscriptionActivated-Monthly")]
        [InlineData("SubscriptionActivated-Quarterly")]
        public async Task HasEverHadSubscriptionAsync_WithSubscriptionActivation_ReturnsTrue(
            string serviceName
        )
        {
            await SeedAsync("user-1", serviceName, TransactionType.Purchase);

            (await _sut.HasEverHadSubscriptionAsync("user-1")).Should().BeTrue();
        }

        [Fact]
        public async Task HasEverHadSubscriptionAsync_WithOnlyTokenPurchasesOrOtherUsers_ReturnsFalse()
        {
            await SeedAsync("user-1", "TokenPurchase-Personal", TransactionType.Purchase);
            await SeedAsync("user-2", "SubscriptionActivated-Monthly", TransactionType.Purchase);

            (await _sut.HasEverHadSubscriptionAsync("user-1")).Should().BeFalse();
        }

        // ---------- GetFirstTransactionDateAsync ----------

        [Fact]
        public async Task GetFirstTransactionDateAsync_ReturnsEarliestDateOfGivenType()
        {
            var first = new DateTime(2026, 10, 1, 8, 0, 0, DateTimeKind.Utc);
            await SeedAsync(
                "user-1",
                "ConsentDiscount-Granted",
                TransactionType.ConsentDiscountGranted,
                first.AddDays(3)
            );
            await SeedAsync(
                "user-1",
                "ConsentDiscount-Granted",
                TransactionType.ConsentDiscountGranted,
                first
            );
            await SeedAsync("user-1", "x", TransactionType.Usage, first.AddDays(-5));

            var result = await _sut.GetFirstTransactionDateAsync(
                "user-1",
                TransactionType.ConsentDiscountGranted
            );

            result.Should().Be(first);
        }

        [Fact]
        public async Task GetFirstTransactionDateAsync_WhenNoTransaction_ReturnsNull()
        {
            var result = await _sut.GetFirstTransactionDateAsync(
                "user-1",
                TransactionType.ConsentDiscountGranted
            );

            result.Should().BeNull();
        }
    }
}
