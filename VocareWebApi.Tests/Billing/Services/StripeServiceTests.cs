using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Implementations;
using VocareWebAPI.Data;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.Billing.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="StripeService"/> obejmujące ścieżki nie wymagające kontaktu
    /// z API Stripe: walidację argumentów oraz reguły biznesowe wykonywane przed wywołaniem SDK.
    /// </summary>
    [Collection(StripeStaticsCollection.Name)]
    public sealed class StripeServiceTests : IDisposable
    {
        private const string UserId = "user-123";
        private const string TokenPriceId = "price_token_1";
        private const string ActiveSubPriceId = "price_sub_active";
        private const string InactiveSubPriceId = "price_sub_inactive";

        private readonly AppDbContext _context;
        private readonly Mock<IUserBillingRepository> _userBillings = new(MockBehavior.Strict);
        private readonly StripeService _sut;

        public StripeServiceTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new StripeService(
                _userBillings.Object,
                BuildConfiguration(),
                NullLogger<StripeService>.Instance,
                _context
            );
        }

        public void Dispose() => _context.Dispose();

        private static IConfiguration BuildConfiguration() =>
            new ConfigurationBuilder()
                .AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["Stripe:SuccessUrl"] = "https://app.test/success",
                        ["Stripe:CancelUrl"] = "https://app.test/cancel",
                        ["Stripe:ReturnUrl"] = "https://app.test/dashboard",
                        ["TokenPackages:0:PriceId"] = TokenPriceId,
                        ["TokenPackages:0:Name"] = "Token Pack",
                        ["TokenPackages:0:TokenAmount"] = "50",
                        ["SubscriptionPackages:0:PriceId"] = ActiveSubPriceId,
                        ["SubscriptionPackages:0:Name"] = "Active Plan",
                        ["SubscriptionPackages:0:Level"] = nameof(SubscriptionLevel.Monthly),
                        ["SubscriptionPackages:0:IsActive"] = "true",
                        ["SubscriptionPackages:1:PriceId"] = InactiveSubPriceId,
                        ["SubscriptionPackages:1:Name"] = "Retired Plan",
                        ["SubscriptionPackages:1:IsActive"] = "false",
                    }
                )
                .Build();

        private UserBilling Billing(
            string? customerId = null,
            SubscriptionStatus status = SubscriptionStatus.None
        ) =>
            new()
            {
                UserId = UserId,
                StripeCustomerId = customerId,
                SubscriptionStatus = status,
            };

        // ---------- CreateCustomerAsync ----------

        [Theory]
        [InlineData("", "a@b.com")]
        [InlineData(UserId, "")]
        public async Task CreateCustomerAsync_WithInvalidArguments_ThrowsArgumentException(
            string userId,
            string email
        )
        {
            await _sut.Invoking(s => s.CreateCustomerAsync(userId, email))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        // ---------- CreateCheckoutSessionForTokenAsync ----------

        [Theory]
        [InlineData("", "price")]
        [InlineData(UserId, "")]
        public async Task CreateCheckoutSessionForTokenAsync_WithInvalidArguments_ThrowsArgumentException(
            string userId,
            string priceId
        )
        {
            await _sut.Invoking(s => s.CreateCheckoutSessionForTokenAsync(userId, priceId))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task CreateCheckoutSessionForTokenAsync_WithUnknownPriceId_ThrowsTokenPackageNotFound()
        {
            await _sut.Invoking(s => s.CreateCheckoutSessionForTokenAsync(UserId, "price_unknown"))
                .Should()
                .ThrowAsync<TokenPackageNotFoundException>();
        }

        // ---------- CreateCheckoutSessionForSubscriptionAsync ----------

        [Theory]
        [InlineData("", "price")]
        [InlineData(UserId, "")]
        public async Task CreateCheckoutSessionForSubscriptionAsync_WithInvalidArguments_ThrowsArgumentException(
            string userId,
            string priceId
        )
        {
            await _sut.Invoking(s => s.CreateCheckoutSessionForSubscriptionAsync(userId, priceId))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task CreateCheckoutSessionForSubscriptionAsync_WithUnknownPriceId_ThrowsSubscriptionPackageNotFound()
        {
            await _sut.Invoking(s =>
                    s.CreateCheckoutSessionForSubscriptionAsync(UserId, "price_unknown")
                )
                .Should()
                .ThrowAsync<SubscriptionPackageNotFoundException>();
        }

        [Fact]
        public async Task CreateCheckoutSessionForSubscriptionAsync_WithInactivePackage_ThrowsInactivePackage()
        {
            await _sut.Invoking(s =>
                    s.CreateCheckoutSessionForSubscriptionAsync(UserId, InactiveSubPriceId)
                )
                .Should()
                .ThrowAsync<InactiveSubscriptionPackageException>();
        }

        [Fact]
        public async Task CreateCheckoutSessionForSubscriptionAsync_WhenSubscriptionAlreadyActive_ThrowsConflict()
        {
            _userBillings
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(Billing(customerId: "cus_1", status: SubscriptionStatus.Active));

            await _sut.Invoking(s =>
                    s.CreateCheckoutSessionForSubscriptionAsync(UserId, ActiveSubPriceId)
                )
                .Should()
                .ThrowAsync<SubscriptionAlreadyActiveException>();
        }

        // ---------- CreateCustomerPortalSessionAsync ----------

        [Fact]
        public async Task CreateCustomerPortalSessionAsync_WithEmptyUserId_ThrowsArgumentException()
        {
            await _sut.Invoking(s => s.CreateCustomerPortalSessionAsync(""))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task CreateCustomerPortalSessionAsync_WithoutStripeCustomer_ThrowsMissingStripeCustomer()
        {
            _userBillings
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(Billing(customerId: null));

            await _sut.Invoking(s => s.CreateCustomerPortalSessionAsync(UserId))
                .Should()
                .ThrowAsync<MissingStripeCustomerException>();
        }

        // ---------- GetPaymentHistoryAsync ----------

        [Fact]
        public async Task GetPaymentHistoryAsync_WithEmptyUserId_ThrowsArgumentException()
        {
            await _sut.Invoking(s => s.GetPaymentHistoryAsync(""))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(101)]
        public async Task GetPaymentHistoryAsync_WithOutOfRangeLimit_ThrowsArgumentException(
            int limit
        )
        {
            await _sut.Invoking(s => s.GetPaymentHistoryAsync(UserId, limit))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task GetPaymentHistoryAsync_WhenBillingRecordMissing_ReturnsEmptyList()
        {
            _userBillings
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ThrowsAsync(new UserBillingNotFoundException(UserId));

            var result = await _sut.GetPaymentHistoryAsync(UserId);

            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetPaymentHistoryAsync_WhenNoStripeCustomer_ReturnsEmptyList()
        {
            _userBillings
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(Billing(customerId: null));

            var result = await _sut.GetPaymentHistoryAsync(UserId);

            result.Should().BeEmpty();
        }
    }
}
