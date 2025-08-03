using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Implementations;
using VocareWebAPI.Data;
using Xunit;

namespace VocareWebApi.Tests.Billing.Services
{
    public class BillingServiceTests
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
            result.Should().BeTrue();

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
            result.Should().BeTrue();
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
            result.Should().BeFalse();
        }

        [Theory]
        [InlineData(null, "service")]
        [InlineData("", "service")]
        [InlineData("user", null)]
        [InlineData("user", "")]
        public async Task CanAccessServiceAsync_InvalidParameters_ThrowsArgumentException(
            string userId,
            string serviceName
        )
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _billingService.CanAccessServiceAsync(userId, serviceName)
            );
        }
    }
}
