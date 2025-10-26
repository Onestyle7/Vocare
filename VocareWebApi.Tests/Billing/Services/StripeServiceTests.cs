using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration; // ✅ Prawidłowy using
using Microsoft.Extensions.Logging;
using Moq;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Implementations;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities;
using Xunit;

namespace VocareWebApi.Tests.Billing.Services
{
    public class StripeServiceTests : IDisposable
    {
        private readonly Mock<IUserBillingRepository> _mockBillingRepo;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<ILogger<StripeService>> _mockLogger;
        private readonly AppDbContext _context;
        private readonly StripeService _service;

        public StripeServiceTests()
        {
            // Setup InMemory database
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new AppDbContext(options);

            _mockBillingRepo = new Mock<IUserBillingRepository>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockLogger = new Mock<ILogger<StripeService>>();

            // ✅ Mock IConfiguration - kluczowe wartości Stripe
            _mockConfiguration
                .Setup(x => x["Stripe:SuccessUrl"])
                .Returns("https://vocare.pl/success");
            _mockConfiguration
                .Setup(x => x["Stripe:CancelUrl"])
                .Returns("https://vocare.pl/cancel");
            _mockConfiguration
                .Setup(x => x["Stripe:SecretKey"])
                .Returns("sk_test_fake_key_for_testing");
            _mockConfiguration
                .Setup(x => x["Stripe:PublishableKey"])
                .Returns("pk_test_fake_key_for_testing");

            // ✅ Mock sekcji TokenPackages (wymagane przez TokenPackagesConfiguration.Initialize)
            var mockTokenPackagesSection = new Mock<IConfigurationSection>();

            // Setup: GetSection("TokenPackages") zwraca mock sekcji
            _mockConfiguration
                .Setup(x => x.GetSection("TokenPackages"))
                .Returns(mockTokenPackagesSection.Object);

            // Setup: Sekcja ma GetChildren() która zwraca puste (lub testowe pakiety)
            mockTokenPackagesSection
                .Setup(x => x.GetChildren())
                .Returns(new List<IConfigurationSection>());

            // ✅ Mock sekcji SubscriptionPackages (wymagane przez SubscriptionPackagesConfiguration.Initialize)
            var mockSubscriptionPackagesSection = new Mock<IConfigurationSection>();

            // Setup: GetSection("SubscriptionPackages") zwraca mock sekcji
            _mockConfiguration
                .Setup(x => x.GetSection("SubscriptionPackages"))
                .Returns(mockSubscriptionPackagesSection.Object);

            // Setup: Sekcja ma GetChildren() która zwraca puste
            mockSubscriptionPackagesSection
                .Setup(x => x.GetChildren())
                .Returns(new List<IConfigurationSection>());

            _service = new StripeService(
                _mockBillingRepo.Object,
                _mockConfiguration.Object,
                _mockLogger.Object,
                _context
            );
        }

        #region CreateCustomer Tests

        /// <summary>
        /// FLOW: Użytkownik już ma customer ID -> po prostu go zwracamy
        ///
        /// DLACZEGO WAŻNE: Nie chcemy tworzyć duplikatów w Stripe!
        /// </summary>
        [Fact]
        public async Task CreateCustomerAsync_ExistingCustomer_ReturnsExistingCustomerId()
        {
            // ARRANGE
            var userId = "existing-user";
            var email = "existing@example.com";
            var existingCustomerId = "cus_existing123";

            var userBilling = new UserBilling
            {
                UserId = userId,
                StripeCustomerId = existingCustomerId,
                TokenBalance = 100,
            };

            _mockBillingRepo.Setup(x => x.GetByUserIdAsync(userId)).ReturnsAsync(userBilling);

            // ACT
            var result = await _service.CreateCustomerAsync(userId, email);

            // ASSERT
            result.Should().Be(existingCustomerId);

            // NIE tworzymy nowego customer
            _mockBillingRepo.Verify(
                x => x.UpdateAsync(It.IsAny<UserBilling>()),
                Times.Never,
                "nie powinniśmy aktualizować billing jeśli customer już istnieje"
            );
        }

        /// <summary>
        /// FLOW: Próbujemy utworzyć customer bez email
        ///
        /// DLACZEGO WAŻNE: Email jest WYMAGANY - testujemy walidację
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public async Task CreateCustomerAsync_InvalidEmail_ThrowsArgumentException(
            string invalidEmail
        )
        {
            // ARRANGE
            var userId = "user-123";

            // ACT & ASSERT
            await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateCustomerAsync(userId, invalidEmail)
            );

            // Nie próbujemy nic robić w Stripe
            _mockBillingRepo.Verify(x => x.CreateAsync(It.IsAny<UserBilling>()), Times.Never);
        }

        #endregion

        #region Subscription Tests

        /// <summary>
        /// FLOW: User próbuje kupić drugą subskrypcję mając już aktywną
        ///
        /// DLACZEGO WAŻNE: Nie możemy mieć wielu aktywnych subskrypcji!
        /// Testujemy logikę biznesową - warunek sprawdzający status.
        /// </summary>
        [Fact]
        public async Task CreateCheckoutSessionForSubscriptionAsync_UserHasActiveSubscription_ThrowsException()
        {
            // ARRANGE
            var userId = "user-with-sub";
            var priceId = "price_1S9q33Ls2ndSVWb2KeB4Y3AD";

            var userBilling = new UserBilling
            {
                UserId = userId,
                SubscriptionStatus = SubscriptionStatus.Active,
                StripeSubscriptionId = "sub_existing123",
            };

            _mockBillingRepo.Setup(x => x.GetByUserIdAsync(userId)).ReturnsAsync(userBilling);

            // ACT & ASSERT
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreateCheckoutSessionForSubscriptionAsync(userId, priceId)
            );

            exception.Message.Should().Contain("already has an active subscription");
        }

        #endregion

        #region Customer Portal Tests

        /// <summary>
        /// FLOW: User bez customer ID próbuje otworzyć portal
        ///
        /// DLACZEGO WAŻNE: Bez customer ID nie możemy utworzyć portal session
        /// Testujemy walidację - czy metoda sprawdza czy customer ID istnieje.
        /// </summary>
        [Fact]
        public async Task CreateCustomerPortalSessionAsync_NoCustomerId_ThrowsException()
        {
            // ARRANGE
            var userId = "user-no-customer";
            var returnUrl = "https://vocare.pl/dashboard";

            var userBilling = new UserBilling
            {
                UserId = userId,
                StripeCustomerId = null, // Brak customer ID!
            };

            _mockBillingRepo.Setup(x => x.GetByUserIdAsync(userId)).ReturnsAsync(userBilling);

            // ACT & ASSERT
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreateCustomerPortalSessionAsync(userId, returnUrl)
            );
        }

        #endregion

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}
