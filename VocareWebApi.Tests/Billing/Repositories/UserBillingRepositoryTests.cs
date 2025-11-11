using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using Moq;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Repositories.Implementations;
using VocareWebAPI.Data;
using Xunit;

namespace VocareWebAPI.Tests.Billing.Repositories
{
    public class UserBillingRepositoryTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly Mock<ILogger<UserBillingRepository>> _mockLogger;
        private readonly UserBillingRepository _repository;
        private readonly DbContextOptions<AppDbContext> _dbContextOptions;

        public UserBillingRepositoryTests()
        {
            // Używamy in-memory database TYLKO dla konstruktora DbContext
            // ale nadal będziemy mockować DbSet dla prawdziwych testów jednostkowych
            _dbContextOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(_dbContextOptions);
            _mockLogger = new Mock<ILogger<UserBillingRepository>>();
            _repository = new UserBillingRepository(_context, _mockLogger.Object);
        }

        public void Dispose()
        {
            _context?.Dispose();
        }

        [Fact]
        public async Task GetByUserIdAsync_WhenUserBillingExists_ShouldReturnUserBilling()
        {
            // Arrange
            var userId = "test-user-123";
            var expectedUserBilling = new UserBilling
            {
                UserId = userId,
                TokenBalance = 100,
                StripeCustomerId = "stripe-123",
            };

            await _context.UserBillings.AddAsync(expectedUserBilling);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByUserIdAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(100, result.TokenBalance);
        }

        [Fact]
        public async Task GetByUserIdAsync_WhenUserIdIsEmpty_ShouldThrowArgumentException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _repository.GetByUserIdAsync(string.Empty)
            );
        }

        [Fact]
        public async Task GetByUserIdAsync_WhenUserBillingNotFound_ShouldThrowKeyNotFoundException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _repository.GetByUserIdAsync("non-existent-user")
            );
        }

        [Fact]
        public async Task CreateAsync_WhenValidUserBilling_ShouldCreateSuccessfully()
        {
            // Arrange
            var userBilling = new UserBilling
            {
                UserId = "new-user-123",
                TokenBalance = 50,
                StripeCustomerId = "stripe-new-123",
            };

            // Act
            var result = await _repository.CreateAsync(userBilling);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userBilling.UserId, result.UserId);

            // Verify it was actually saved
            var savedBilling = await _context.UserBillings.FirstOrDefaultAsync(ub =>
                ub.UserId == userBilling.UserId
            );
            Assert.NotNull(savedBilling);
            Assert.Equal(50, savedBilling.TokenBalance);
        }

        [Fact]
        public async Task CreateAsync_WhenUserBillingIsNull_ShouldThrowArgumentNullException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.CreateAsync(null));
        }

        [Fact]
        public async Task CreateAsync_WhenUserIdIsEmpty_ShouldThrowArgumentException()
        {
            // Arrange
            var userBilling = new UserBilling { UserId = string.Empty };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => _repository.CreateAsync(userBilling));
        }

        [Fact]
        public async Task CreateAsync_WhenUserBillingAlreadyExists_ShouldThrowInvalidOperationException()
        {
            // Arrange
            var existingUserBilling = new UserBilling
            {
                UserId = "existing-user",
                TokenBalance = 100,
            };

            await _context.UserBillings.AddAsync(existingUserBilling);
            await _context.SaveChangesAsync();

            var newUserBilling = new UserBilling { UserId = "existing-user", TokenBalance = 50 };

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _repository.CreateAsync(newUserBilling)
            );
        }

        [Fact]
        public async Task UpdateAsync_WhenValidUserBilling_ShouldUpdateSuccessfully()
        {
            // Arrange
            var existingUserBilling = new UserBilling { UserId = "user-123", TokenBalance = 100 };

            await _context.UserBillings.AddAsync(existingUserBilling);
            await _context.SaveChangesAsync();

            var updatedUserBilling = new UserBilling { UserId = "user-123", TokenBalance = 200 };

            // Act
            await _repository.UpdateAsync(updatedUserBilling);

            // Assert
            var result = await _context.UserBillings.FirstOrDefaultAsync(ub =>
                ub.UserId == "user-123"
            );
            Assert.Equal(200, result.TokenBalance);
        }

        [Fact]
        public async Task UpdateAsync_WhenUserBillingIsNull_ShouldThrowArgumentNullException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.UpdateAsync(null));
        }

        [Fact]
        public async Task UpdateAsync_WhenUserBillingNotFound_ShouldThrowInvalidOperationException()
        {
            // Arrange
            var userBilling = new UserBilling { UserId = "non-existent", TokenBalance = 100 };

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _repository.UpdateAsync(userBilling)
            );
        }

        [Fact]
        public async Task HasEnoughTokensAsync_WhenHasEnoughTokens_ShouldReturnTrue()
        {
            // Arrange
            var userId = "user-123";
            var userBilling = new UserBilling { UserId = userId, TokenBalance = 100 };

            await _context.UserBillings.AddAsync(userBilling);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.HasEnoughTokensAsync(userId, 50);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task HasEnoughTokensAsync_WhenNotEnoughTokens_ShouldReturnFalse()
        {
            // Arrange
            var userId = "user-123";
            var userBilling = new UserBilling { UserId = userId, TokenBalance = 30 };

            await _context.UserBillings.AddAsync(userBilling);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.HasEnoughTokensAsync(userId, 50);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HasEnoughTokensAsync_WhenUserIdIsEmpty_ShouldThrowArgumentException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _repository.HasEnoughTokensAsync(string.Empty, 50)
            );
        }

        [Fact]
        public async Task HasEnoughTokensAsync_WhenRequiredTokensIsZero_ShouldThrowArgumentException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _repository.HasEnoughTokensAsync("user-123", 0)
            );
        }

        [Fact]
        public async Task AddTokensAsync_WhenUserExists_ShouldAddTokensSuccessfully()
        {
            // Arrange
            var userId = "user-123";
            var userBilling = new UserBilling
            {
                UserId = userId,
                TokenBalance = 50,
                LastTokenPurchaseDate = DateTime.UtcNow.AddDays(-5),
            };

            await _context.UserBillings.AddAsync(userBilling);
            await _context.SaveChangesAsync();

            // Act
            await _repository.AddTokensAsync(userId, 100);

            // Assert
            var result = await _context.UserBillings.FirstOrDefaultAsync(ub => ub.UserId == userId);
            Assert.Equal(150, result.TokenBalance);
        }

        [Fact]
        public async Task AddTokensAsync_WhenUserIdIsEmpty_ShouldThrowArgumentException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => _repository.AddTokensAsync("", 100));
        }

        [Fact]
        public async Task AddTokensAsync_WhenAmountIsZero_ShouldThrowArgumentException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _repository.AddTokensAsync("user-123", 0)
            );
        }

        [Fact]
        public async Task AddTokensAsync_WhenUserNotFound_ShouldThrowKeyNotFoundException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _repository.AddTokensAsync("non-existent", 100)
            );
        }

        [Fact]
        public async Task GetUserIdByCustomerIdAsync_WhenCustomerExists_ShouldReturnUserId()
        {
            // Arrange
            var customerId = "stripe-customer-123";
            var userId = "user-123";
            var userBilling = new UserBilling
            {
                UserId = userId,
                StripeCustomerId = customerId,
                TokenBalance = 100,
            };

            await _context.UserBillings.AddAsync(userBilling);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetUserIdByCustomerIdAsync(customerId);

            // Assert
            Assert.Equal(userId, result);
        }

        [Fact]
        public async Task GetUserIdByCustomerIdAsync_WhenCustomerNotFound_ShouldReturnNull()
        {
            // Act
            var result = await _repository.GetUserIdByCustomerIdAsync("non-existent-customer");

            // Assert
            Assert.Null(result);
        }

        // Testy dla DeductTokensAsync nie mogą być wykonane w pełni jako unit testy
        // ponieważ używają FromSqlRaw, który nie działa z in-memory database.
        // Poniżej alternatywne podejście - test integracyjny lub pomijamy te testy

        [Fact(Skip = "FromSqlRaw not supported in in-memory database - requires integration test")]
        public async Task DeductTokensAsync_WhenHasEnoughTokens_ShouldDeductSuccessfully()
        {
            // This test requires a real database or test database
            // FromSqlRaw with FOR UPDATE is not supported by in-memory provider
        }

        [Fact]
        public async Task DeductTokensAsync_WhenUserIdIsEmpty_ShouldThrowArgumentException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _repository.DeductTokensAsync(string.Empty, 50)
            );
        }

        [Fact]
        public async Task DeductTokensAsync_WhenAmountIsZero_ShouldThrowArgumentException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _repository.DeductTokensAsync("user-123", 0)
            );
        }

        [Fact(Skip = "FromSqlRaw not supported in in-memory database - requires integration test")]
        public async Task ConcurrentDeductions_ShouldBeHandledSafely()
        {
            // This test requires a real database with transaction support
            // In-memory database doesn't support FromSqlRaw with FOR UPDATE
        }

        [Fact(Skip = "FromSqlRaw not supported in in-memory database - requires integration test")]
        public async Task CompleteTokenPurchaseFlow_ShouldWorkCorrectly()
        {
            // This test requires a real database for full flow with transactions
        }
    }
}
