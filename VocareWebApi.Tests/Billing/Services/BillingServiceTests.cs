using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
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
    /// Testy jednostkowe <see cref="BillingService"/> – logika dostępu do usług,
    /// odejmowania tokenów oraz obsługi webhooków Stripe.
    /// </summary>
    public sealed class BillingServiceTests : IDisposable
    {
        private const string UserId = "user-123";
        private const string ServiceName = "AnalyzeProfile";
        private const string WebhookSecret = "whsec_test_secret";

        private readonly AppDbContext _context;
        private readonly Mock<IServiceCostRepository> _serviceCosts = new(MockBehavior.Strict);
        private readonly Mock<IUserBillingRepository> _userBillings = new(MockBehavior.Strict);
        private readonly Mock<ITokenTransactionRepository> _transactions = new(MockBehavior.Strict);
        private readonly BillingService _sut;

        public BillingServiceTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new BillingService(
                _context,
                _serviceCosts.Object,
                _userBillings.Object,
                _transactions.Object,
                TestConfiguration.FromValues(("Stripe:WebhookSecret", WebhookSecret)),
                NullLogger<BillingService>.Instance
            );
        }

        public void Dispose() => _context.Dispose();

        private static UserBilling Billing(
            int balance = 0,
            SubscriptionStatus status = SubscriptionStatus.None
        ) =>
            new()
            {
                UserId = UserId,
                TokenBalance = balance,
                SubscriptionStatus = status,
            };

        // ---------- Konstruktor ----------

        [Fact]
        public void Constructor_WhenWebhookSecretMissing_Throws()
        {
            var act = () =>
                new BillingService(
                    _context,
                    _serviceCosts.Object,
                    _userBillings.Object,
                    _transactions.Object,
                    TestConfiguration.FromValues(),
                    NullLogger<BillingService>.Instance
                );

            act.Should().Throw<ArgumentNullException>();
        }

        // ---------- CanAccessServiceAsync ----------

        [Theory]
        [InlineData(null, ServiceName)]
        [InlineData("", ServiceName)]
        [InlineData(UserId, null)]
        [InlineData(UserId, "")]
        public async Task CanAccessServiceAsync_WithInvalidArguments_ThrowsArgumentException(
            string? userId,
            string? serviceName
        )
        {
            var act = () => _sut.CanAccessServiceAsync(userId!, serviceName!);

            await act.Should().ThrowAsync<ArgumentException>();
            _serviceCosts.VerifyNoOtherCalls();
            _userBillings.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task CanAccessServiceAsync_WithActiveSubscription_SucceedsEvenWithZeroTokens()
        {
            _serviceCosts.Setup(r => r.GetServiceCostAsync(ServiceName)).ReturnsAsync(60);
            _userBillings
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(Billing(balance: 0, status: SubscriptionStatus.Active));

            var act = () => _sut.CanAccessServiceAsync(UserId, ServiceName);

            await act.Should().NotThrowAsync();
        }

        [Fact]
        public async Task CanAccessServiceAsync_WithSufficientTokenBalance_Succeeds()
        {
            _serviceCosts.Setup(r => r.GetServiceCostAsync(ServiceName)).ReturnsAsync(60);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(Billing(balance: 60));

            await _sut.Invoking(s => s.CanAccessServiceAsync(UserId, ServiceName))
                .Should()
                .NotThrowAsync();
        }

        [Fact]
        public async Task CanAccessServiceAsync_WithInsufficientTokens_ThrowsWithBalanceDetails()
        {
            _serviceCosts.Setup(r => r.GetServiceCostAsync(ServiceName)).ReturnsAsync(60);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(Billing(balance: 59));

            var act = () => _sut.CanAccessServiceAsync(UserId, ServiceName);

            var ex = (await act.Should().ThrowAsync<InsufficientTokensException>()).Which;
            ex.CurrentBalance.Should().Be(59);
            ex.RequiredTokens.Should().Be(60);
            ex.UserId.Should().Be(UserId);
        }

        // ---------- DeductTokensForServiceAsync ----------

        [Fact]
        public async Task DeductTokensForServiceAsync_WithNonPositiveServiceCost_ThrowsInvalidServiceCost()
        {
            _serviceCosts.Setup(r => r.GetServiceCostAsync(ServiceName)).ReturnsAsync(0);

            await _sut.Invoking(s => s.DeductTokensForServiceAsync(UserId, ServiceName))
                .Should()
                .ThrowAsync<InvalidServiceCostException>();
        }

        [Fact]
        public async Task DeductTokensForServiceAsync_WithActiveSubscription_DoesNotDeductOrRecord()
        {
            _serviceCosts.Setup(r => r.GetServiceCostAsync(ServiceName)).ReturnsAsync(20);
            var billing = Billing(balance: 100, status: SubscriptionStatus.Active);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);

            await _sut.DeductTokensForServiceAsync(UserId, ServiceName);

            billing.TokenBalance.Should().Be(100);
            (await _context.TokenTransactions.AnyAsync()).Should().BeFalse();
        }

        [Fact]
        public async Task DeductTokensForServiceAsync_WithInsufficientBalance_ThrowsAndRecordsNothing()
        {
            _serviceCosts.Setup(r => r.GetServiceCostAsync(ServiceName)).ReturnsAsync(20);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(Billing(balance: 19));

            await _sut.Invoking(s => s.DeductTokensForServiceAsync(UserId, ServiceName))
                .Should()
                .ThrowAsync<InsufficientTokensException>();

            (await _context.TokenTransactions.AnyAsync()).Should().BeFalse();
        }

        [Fact]
        public async Task DeductTokensForServiceAsync_WithSufficientBalance_DeductsAndWritesUsageTransaction()
        {
            _serviceCosts.Setup(r => r.GetServiceCostAsync(ServiceName)).ReturnsAsync(20);
            var billing = Billing(balance: 50);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);

            await _sut.DeductTokensForServiceAsync(UserId, ServiceName);

            billing.TokenBalance.Should().Be(30);
            billing
                .LastTokenPurchaseDate.Should()
                .BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

            var transaction = await _context.TokenTransactions.SingleAsync();
            transaction.UserId.Should().Be(UserId);
            transaction.ServiceName.Should().Be(ServiceName);
            transaction.Amount.Should().Be(-20);
            transaction.Type.Should().Be(TransactionType.Usage);
        }

        [Theory]
        [InlineData(null, ServiceName)]
        [InlineData(" ", ServiceName)]
        [InlineData(UserId, "")]
        public async Task DeductTokensForServiceAsync_WithInvalidArguments_ThrowsArgumentException(
            string? userId,
            string? serviceName
        )
        {
            await _sut.Invoking(s => s.DeductTokensForServiceAsync(userId!, serviceName!))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        // ---------- GetUserBillingAsync ----------

        [Fact]
        public async Task GetUserBillingAsync_ReturnsRecordFromRepository()
        {
            var billing = Billing(balance: 42, status: SubscriptionStatus.Trialing);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);

            var result = await _sut.GetUserBillingAsync(UserId);

            result.Should().BeSameAs(billing);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public async Task GetUserBillingAsync_WithInvalidUserId_ThrowsArgumentException(
            string? userId
        )
        {
            await _sut.Invoking(s => s.GetUserBillingAsync(userId!))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task GetUserBillingAsync_WhenRepositoryThrowsNotFound_PropagatesException()
        {
            _userBillings
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ThrowsAsync(new UserBillingNotFoundException(UserId));

            await _sut.Invoking(s => s.GetUserBillingAsync(UserId))
                .Should()
                .ThrowAsync<UserBillingNotFoundException>();
        }

        // ---------- HandleWebhookAsync ----------

        [Theory]
        [InlineData(null, "t=1700000000,v1=0000000000000000000000000000000000000000")]
        [InlineData("", "t=1700000000,v1=0000000000000000000000000000000000000000")]
        [InlineData("{}", null)]
        public async Task HandleWebhookAsync_WithMissingPayloadOrSignature_ThrowsArgumentException(
            string? json,
            string? signature
        )
        {
            await _sut.Invoking(s => s.HandleWebhookAsync(json!, signature!))
                .Should()
                .ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task HandleWebhookAsync_WithInvalidSignature_ThrowsStripeException()
        {
            var payload = StripeWebhookFactory.GenericEvent("ping");
            var wrongSignature = "t=1700000000,v1=" + new string('a', 64);

            await _sut.Invoking(s => s.HandleWebhookAsync(payload, wrongSignature))
                .Should()
                .ThrowAsync<Stripe.StripeException>();
        }

        [Fact]
        public async Task HandleWebhookAsync_WithUnhandledEventType_CompletesWithoutSideEffects()
        {
            var payload = StripeWebhookFactory.GenericEvent("customer.created");
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);

            await _sut.Invoking(s => s.HandleWebhookAsync(payload, signature))
                .Should()
                .NotThrowAsync();

            (await _context.TokenTransactions.AnyAsync()).Should().BeFalse();
        }

        [Fact]
        public async Task HandleWebhookAsync_WithCompletedTokenCheckout_AddsTokensAndPurchaseTransaction()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[]
                {
                    ("userId", UserId),
                    ("tokenAmount", "50"),
                    ("packageName", "Standard Token Pack"),
                }
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);

            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(Billing(balance: 10));
            _userBillings.Setup(r => r.AddTokensAsync(UserId, 50)).Returns(Task.CompletedTask);
            _transactions
                .Setup(r => r.AddTransactionAsync(It.IsAny<TokenTransaction>()))
                .Returns(Task.CompletedTask);

            await _sut.HandleWebhookAsync(payload, signature);

            _userBillings.Verify(r => r.AddTokensAsync(UserId, 50), Times.Once);
            _transactions.Verify(
                r =>
                    r.AddTransactionAsync(
                        It.Is<TokenTransaction>(t =>
                            t.UserId == UserId
                            && t.Amount == 50
                            && t.Type == TransactionType.Purchase
                        )
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task HandleWebhookAsync_WithCompletedCheckoutMissingTokenAmount_ThrowsInvalidOperation()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[] { ("userId", UserId) }
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);

            await _sut.Invoking(s => s.HandleWebhookAsync(payload, signature))
                .Should()
                .ThrowAsync<InvalidOperationException>();
        }

        [Fact]
        public async Task HandleWebhookAsync_WithCompletedCheckoutNonNumericTokenAmount_ThrowsInvalidOperation()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[] { ("userId", UserId), ("tokenAmount", "not-a-number") }
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);

            await _sut.Invoking(s => s.HandleWebhookAsync(payload, signature))
                .Should()
                .ThrowAsync<InvalidOperationException>();
        }

        [Fact]
        public async Task HandleWebhookAsync_WithNonPaymentCheckoutMode_DoesNotAddTokens()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "setup",
                metadata: new[] { ("userId", UserId), ("tokenAmount", "50") }
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);

            await _sut.HandleWebhookAsync(payload, signature);

            _userBillings.Verify(
                r => r.AddTokensAsync(It.IsAny<string>(), It.IsAny<int>()),
                Times.Never
            );
        }
    }
}
