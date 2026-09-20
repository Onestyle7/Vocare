using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Implementations;
using VocareWebAPI.Data;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.Billing.Repositories
{
    /// <summary>
    /// Testy jednostkowe <see cref="UserBillingRepository"/> na dostawcy EF Core InMemory.
    /// Metody wykorzystujące surowy SQL (<c>DeductTokensAsync</c>) pokryte są jedynie w zakresie
    /// walidacji argumentów – ścieżka blokady wiersza (<c>FOR UPDATE</c>) wymaga bazy PostgreSQL.
    /// </summary>
    public sealed class UserBillingRepositoryTests : IDisposable
    {
        private const string UserId = "user-123";

        private readonly AppDbContext _context;
        private readonly UserBillingRepository _sut;

        public UserBillingRepositoryTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new UserBillingRepository(_context, NullLogger<UserBillingRepository>.Instance);
        }

        public void Dispose() => _context.Dispose();

        private async Task<UserBilling> SeedBillingAsync(
            int balance = 100,
            string? customerId = null,
            SubscriptionStatus status = SubscriptionStatus.None
        )
        {
            var billing = new UserBilling
            {
                UserId = UserId,
                TokenBalance = balance,
                StripeCustomerId = customerId,
                SubscriptionStatus = status,
            };
            _context.UserBillings.Add(billing);
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
            return billing;
        }

        // ---------- GetByUserIdAsync ----------

        [Fact]
        public async Task GetByUserIdAsync_WhenRecordExists_ReturnsRecord()
        {
            await SeedBillingAsync(balance: 250);

            var result = await _sut.GetByUserIdAsync(UserId);

            result.TokenBalance.Should().Be(250);
        }

        [Fact]
        public async Task GetByUserIdAsync_WhenRecordMissing_ThrowsUserBillingNotFound()
        {
            await _sut.Invoking(r => r.GetByUserIdAsync("ghost"))
                .Should()
                .ThrowAsync<UserBillingNotFoundException>();
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public async Task GetByUserIdAsync_WithInvalidUserId_ThrowsArgumentException(string? userId)
        {
            await _sut.Invoking(r => r.GetByUserIdAsync(userId!))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        // ---------- CreateAsync ----------

        [Fact]
        public async Task CreateAsync_WithNewRecord_PersistsAndReturnsIt()
        {
            var billing = new UserBilling { UserId = UserId, TokenBalance = 30 };

            var result = await _sut.CreateAsync(billing);

            result.UserId.Should().Be(UserId);
            _context.ChangeTracker.Clear();
            (await _context.UserBillings.AsNoTracking().SingleAsync()).TokenBalance.Should().Be(30);
        }

        [Fact]
        public async Task CreateAsync_WithNull_ThrowsArgumentNullException()
        {
            await _sut.Invoking(r => r.CreateAsync(null!))
                .Should()
                .ThrowAsync<ArgumentNullException>();
        }

        [Fact]
        public async Task CreateAsync_WithEmptyUserId_ThrowsArgumentException()
        {
            await _sut.Invoking(r => r.CreateAsync(new UserBilling { UserId = "" }))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task CreateAsync_WhenRecordAlreadyExists_ThrowsAlreadyExists()
        {
            await SeedBillingAsync();

            await _sut.Invoking(r => r.CreateAsync(new UserBilling { UserId = UserId }))
                .Should()
                .ThrowAsync<UserBillingAlreadyExistsException>();
        }

        // ---------- UpdateAsync ----------

        [Fact]
        public async Task UpdateAsync_WithExistingRecord_PersistsChangedValues()
        {
            await SeedBillingAsync(balance: 10);

            await _sut.UpdateAsync(
                new UserBilling
                {
                    UserId = UserId,
                    TokenBalance = 999,
                    SubscriptionStatus = SubscriptionStatus.Active,
                }
            );

            var reloaded = await _context.UserBillings.AsNoTracking().SingleAsync();
            reloaded.TokenBalance.Should().Be(999);
            reloaded.SubscriptionStatus.Should().Be(SubscriptionStatus.Active);
        }

        [Fact]
        public async Task UpdateAsync_WithNull_ThrowsArgumentNullException()
        {
            await _sut.Invoking(r => r.UpdateAsync(null!))
                .Should()
                .ThrowAsync<ArgumentNullException>();
        }

        [Fact]
        public async Task UpdateAsync_WhenRecordMissing_ThrowsUserBillingNotFound()
        {
            await _sut.Invoking(r => r.UpdateAsync(new UserBilling { UserId = "ghost" }))
                .Should()
                .ThrowAsync<UserBillingNotFoundException>();
        }

        // ---------- HasEnoughTokensAsync ----------

        [Theory]
        [InlineData(100, 100, true)]
        [InlineData(100, 101, false)]
        [InlineData(100, 1, true)]
        public async Task HasEnoughTokensAsync_ComparesBalanceAgainstRequirement(
            int balance,
            int required,
            bool expected
        )
        {
            await SeedBillingAsync(balance);

            (await _sut.HasEnoughTokensAsync(UserId, required)).Should().Be(expected);
        }

        [Fact]
        public async Task HasEnoughTokensAsync_WhenRecordMissing_ThrowsUserBillingNotFound()
        {
            await _sut.Invoking(r => r.HasEnoughTokensAsync("ghost", 1))
                .Should()
                .ThrowAsync<UserBillingNotFoundException>();
        }

        [Theory]
        [InlineData("", 10)]
        [InlineData(UserId, 0)]
        [InlineData(UserId, -5)]
        public async Task HasEnoughTokensAsync_WithInvalidArguments_ThrowsArgumentException(
            string userId,
            int required
        )
        {
            await _sut.Invoking(r => r.HasEnoughTokensAsync(userId, required))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        // ---------- AddTokensAsync ----------

        [Fact]
        public async Task AddTokensAsync_IncrementsBalanceAndStampsPurchaseDate()
        {
            await SeedBillingAsync(balance: 40);

            await _sut.AddTokensAsync(UserId, 60);

            var reloaded = await _context.UserBillings.AsNoTracking().SingleAsync();
            reloaded.TokenBalance.Should().Be(100);
            reloaded
                .LastTokenPurchaseDate.Should()
                .BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        }

        [Theory]
        [InlineData("", 10)]
        [InlineData(UserId, 0)]
        public async Task AddTokensAsync_WithInvalidArguments_ThrowsArgumentException(
            string userId,
            int amount
        )
        {
            await _sut.Invoking(r => r.AddTokensAsync(userId, amount))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task AddTokensAsync_WhenRecordMissing_ThrowsUserBillingNotFound()
        {
            await _sut.Invoking(r => r.AddTokensAsync("ghost", 10))
                .Should()
                .ThrowAsync<UserBillingNotFoundException>();
        }

        // ---------- GetUserIdByCustomerIdAsync ----------

        [Fact]
        public async Task GetUserIdByCustomerIdAsync_WhenCustomerKnown_ReturnsUserId()
        {
            await SeedBillingAsync(customerId: "cus_1");

            (await _sut.GetUserIdByCustomerIdAsync("cus_1")).Should().Be(UserId);
        }

        [Fact]
        public async Task GetUserIdByCustomerIdAsync_WhenCustomerUnknown_ReturnsNull()
        {
            (await _sut.GetUserIdByCustomerIdAsync("cus_missing")).Should().BeNull();
        }

        // ---------- DeductTokensAsync (walidacja argumentów) ----------

        [Theory]
        [InlineData("", 10)]
        [InlineData(UserId, 0)]
        [InlineData(UserId, -1)]
        public async Task DeductTokensAsync_WithInvalidArguments_ThrowsArgumentException(
            string userId,
            int amount
        )
        {
            await _sut.Invoking(r => r.DeductTokensAsync(userId, amount))
                .Should()
                .ThrowAsync<ArgumentException>();
        }
    }
}
