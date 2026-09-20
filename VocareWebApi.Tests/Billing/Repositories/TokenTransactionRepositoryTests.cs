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
    }
}
