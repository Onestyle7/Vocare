using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Implementations;
using VocareWebAPI.Data;
using Xunit;

namespace VocareWebApi.Tests.Billing.Services
{
    public class BillingServiceTests : IDisposable
    {
        private readonly Mock<IServiceCostRepository> _mockServiceCostRepo;
        private readonly Mock<IUserBillingRepository> _mockUserBillingRepo;
        private readonly Mock<ITokenTransactionRepository> _mockTokenTransactionRepo;
        private readonly Mock<ILogger<BillingService>> _mockLogger;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly BillingService _billingService;
        private readonly AppDbContext _context;

        public BillingServiceTests()
        {
            // Arrange - przygotowujemy mocki wszystkich zależności
            _mockServiceCostRepo = new Mock<IServiceCostRepository>();
            _mockUserBillingRepo = new Mock<IUserBillingRepository>();
            _mockTokenTransactionRepo = new Mock<ITokenTransactionRepository>();
            _mockLogger = new Mock<ILogger<BillingService>>();
            _mockConfiguration = new Mock<IConfiguration>();

            // Konfiguracja dla webhook secret
            _mockConfiguration.Setup(x => x["Stripe:WebhookSecret"]).Returns("test_secret");

            // Tworzymy kontekst bazy danych w pamięci
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new AppDbContext(options);

            // Inicjalizacja serwisu z mockami
            _billingService = new BillingService(
                _context,
                _mockServiceCostRepo.Object,
                _mockUserBillingRepo.Object,
                _mockTokenTransactionRepo.Object,
                _mockConfiguration.Object,
                _mockLogger.Object
            );
        }

        [Fact]
        public async Task CanAccessServiceAsync_UserHasActiveSubscription_ReturnsTrue()
        {
            // Arrange
            var userId = "test-user-123";
            var serviceName = "AnalyzeProfile";

            var userBilling = new UserBilling
            {
                UserId = userId,
                TokenBalance = 0, // Nie ma tokenów, ale...
                SubscriptionStatus = SubscriptionStatus.Active, // ...ma aktywną subskrypcję
            };

            _mockServiceCostRepo.Setup(x => x.GetServiceCostAsync(serviceName)).ReturnsAsync(5);

            _mockUserBillingRepo.Setup(x => x.GetByUserIdAsync(userId)).ReturnsAsync(userBilling);

            // Act
            var result = await _billingService.CanAccessServiceAsync(userId, serviceName);

            // Assert
            result
                .Should()
                .BeTrue("użytkownik z aktywną subskrypcją powinien mieć dostęp do usługi");

            // Weryfikujemy, że metody zostały wywołane
            _mockServiceCostRepo.Verify(x => x.GetServiceCostAsync(serviceName), Times.Once);
            _mockUserBillingRepo.Verify(x => x.GetByUserIdAsync(userId), Times.Once);
        }

        [Fact]
        public async Task CanAccessServiceAsync_UserHasEnoughTokens_ReturnsTrue()
        {
            // Arrange
            var userId = "test-user-123";
            var serviceName = "AnalyzeProfile";
            var serviceCost = 5;

            var userBilling = new UserBilling
            {
                UserId = userId,
                TokenBalance = 10, // Ma wystarczająco tokenów
                SubscriptionStatus = SubscriptionStatus.None, // Nie ma subskrypcji
            };

            _mockServiceCostRepo
                .Setup(x => x.GetServiceCostAsync(serviceName))
                .ReturnsAsync(serviceCost);

            _mockUserBillingRepo.Setup(x => x.GetByUserIdAsync(userId)).ReturnsAsync(userBilling);

            // Act
            var result = await _billingService.CanAccessServiceAsync(userId, serviceName);

            // Assert
            result.Should().BeTrue("użytkownik ma wystarczającą liczbę tokenów");
        }

        [Fact]
        public async Task CanAccessServiceAsync_UserHasNotEnoughTokens_ReturnsFalse()
        {
            // Arrange
            var userId = "test-user-123";
            var serviceName = "AnalyzeProfile";

            var userBilling = new UserBilling
            {
                UserId = userId,
                TokenBalance = 2, // Za mało tokenów
                SubscriptionStatus = SubscriptionStatus.None,
            };

            _mockServiceCostRepo.Setup(x => x.GetServiceCostAsync(serviceName)).ReturnsAsync(5);

            _mockUserBillingRepo.Setup(x => x.GetByUserIdAsync(userId)).ReturnsAsync(userBilling);

            // Act
            var result = await _billingService.CanAccessServiceAsync(userId, serviceName);

            // Assert
            result.Should().BeFalse("użytkownik nie ma wystarczającej liczby tokenów");
        }

        [Theory]
        [InlineData(null, "service")]
        [InlineData("", "service")]
        [InlineData("user", null)]
        [InlineData("user", "")]
        public async Task CanAccessServiceAsync_InvalidParameters_ThrowsArgumentException(
            string? userId,
            string? serviceName
        )
        {
            // Act & Assert
            var action = async () =>
                await _billingService.CanAccessServiceAsync(userId!, serviceName!);

            await action
                .Should()
                .ThrowAsync<ArgumentException>()
                .WithMessage("User ID and service name cannot be null or empty.");
        }

        [Fact]
        public async Task DeductTokensForServiceAsync_ActiveSubscription_DoesNotDeductTokens()
        {
            // Arrange
            var userId = "test-user-123";
            var serviceName = "AnalyzeProfile";

            // Dodajemy użytkownika do bazy InMemory
            var userBilling = new UserBilling
            {
                UserId = userId,
                TokenBalance = 100,
                SubscriptionStatus = SubscriptionStatus.Active,
            };
            _context.UserBillings.Add(userBilling);
            await _context.SaveChangesAsync();

            _mockServiceCostRepo.Setup(x => x.GetServiceCostAsync(serviceName)).ReturnsAsync(5);

            // Act
            await _billingService.DeductTokensForServiceAsync(userId, serviceName);

            // Assert
            var updatedBilling = await _context.UserBillings.FindAsync(userId);
            updatedBilling!
                .TokenBalance.Should()
                .Be(100, "tokeny nie powinny być odjęte dla aktywnej subskrypcji");

            // Sprawdzamy, że nie dodano transakcji
            var transactions = await _context.TokenTransactions.ToListAsync();
            transactions.Should().BeEmpty();
        }

        [Fact]
        public async Task DeductTokensForServiceAsync_NoSubscription_DeductsTokens()
        {
            // Arrange
            var userId = "test-user-123";
            var serviceName = "AnalyzeProfile";
            var serviceCost = 5;
            var initialBalance = 100;

            // Dodajemy użytkownika do bazy InMemory
            var userBilling = new UserBilling
            {
                UserId = userId,
                TokenBalance = initialBalance,
                SubscriptionStatus = SubscriptionStatus.None,
            };
            _context.UserBillings.Add(userBilling);
            await _context.SaveChangesAsync();

            _mockServiceCostRepo
                .Setup(x => x.GetServiceCostAsync(serviceName))
                .ReturnsAsync(serviceCost);

            // Act
            await _billingService.DeductTokensForServiceAsync(userId, serviceName);

            // Assert
            var updatedBilling = await _context.UserBillings.FindAsync(userId);
            updatedBilling!.TokenBalance.Should().Be(initialBalance - serviceCost);

            // Sprawdzamy transakcję
            var transaction = await _context.TokenTransactions.FirstOrDefaultAsync();
            transaction.Should().NotBeNull();
            transaction!.UserId.Should().Be(userId);
            transaction.ServiceName.Should().Be(serviceName);
            transaction.Amount.Should().Be(-serviceCost);
            transaction.Type.Should().Be(TransactionType.Usage);
        }

        [Fact]
        public async Task DeductTokensForServiceAsync_InsufficientTokens_ThrowsException()
        {
            // Arrange
            var userId = "test-user-123";
            var serviceName = "AnalyzeProfile";

            var userBilling = new UserBilling
            {
                UserId = userId,
                TokenBalance = 2, // Za mało tokenów
                SubscriptionStatus = SubscriptionStatus.None,
            };
            _context.UserBillings.Add(userBilling);
            await _context.SaveChangesAsync();

            _mockServiceCostRepo.Setup(x => x.GetServiceCostAsync(serviceName)).ReturnsAsync(5);

            // Act & Assert
            var action = async () =>
                await _billingService.DeductTokensForServiceAsync(userId, serviceName);

            await action
                .Should()
                .ThrowAsync<InvalidOperationException>()
                .WithMessage($"User {userId} does not have enough tokens to access {serviceName}.");
        }

        [Fact]
        public async Task GetUserBillingAsync_UserExists_ReturnsBilling()
        {
            // Arrange
            var userId = "test-user-123";
            var expectedBilling = new UserBilling
            {
                UserId = userId,
                TokenBalance = 50,
                SubscriptionStatus = SubscriptionStatus.Active,
            };

            _mockUserBillingRepo
                .Setup(x => x.GetByUserIdAsync(userId))
                .ReturnsAsync(expectedBilling);

            // Act
            var result = await _billingService.GetUserBillingAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.UserId.Should().Be(userId);
            result.TokenBalance.Should().Be(50);
            result.SubscriptionStatus.Should().Be(SubscriptionStatus.Active);
        }

        [Fact]
        public async Task GetUserBillingAsync_UserNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            var userId = "non-existent-user";

            _mockUserBillingRepo
                .Setup(x => x.GetByUserIdAsync(userId))
                .ThrowsAsync(new KeyNotFoundException());

            // Act & Assert
            var action = async () => await _billingService.GetUserBillingAsync(userId);

            await action.Should().ThrowAsync<KeyNotFoundException>();
        }

        [Fact]
        public async Task HandleWebhookAsync_InvalidParameters_ThrowsArgumentException()
        {
            // Arrange
            string json = "";
            string stripeSignature = "";

            // Act & Assert
            var action = async () =>
                await _billingService.HandleWebhookAsync(json, stripeSignature);

            await action
                .Should()
                .ThrowAsync<ArgumentException>()
                .WithMessage("Invalid webhook payload or missing signature.");
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}
