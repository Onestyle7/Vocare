using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using VocareWebAPI.Billing.Constants;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Dtos;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Implementations;
using VocareWebAPI.Billing.Services.Interfaces;
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
        private readonly Mock<IBackgroundJobClient> _jobs = new();
        private readonly Mock<IConsentDiscountService> _consentDiscount = new(MockBehavior.Strict);
        private readonly Mock<Stripe.SubscriptionService> _stripeSubscriptions = new(
            MockBehavior.Strict
        );
        private readonly BillingService _sut;

        public BillingServiceTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = new BillingService(
                _context,
                _serviceCosts.Object,
                _userBillings.Object,
                _transactions.Object,
                _jobs.Object,
                _consentDiscount.Object,
                _stripeSubscriptions.Object,
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

        /// <summary>Aktualny stan subskrypcji zwracany przez Stripe API (źródło prawdy w handlerach).</summary>
        private void SetupStripeSubscription(string subscriptionId, string status) =>
            _stripeSubscriptions
                .Setup(s =>
                    s.GetAsync(
                        subscriptionId,
                        It.IsAny<Stripe.SubscriptionGetOptions>(),
                        It.IsAny<Stripe.RequestOptions>(),
                        It.IsAny<System.Threading.CancellationToken>()
                    )
                )
                .ReturnsAsync(
                    new Stripe.Subscription
                    {
                        Id = subscriptionId,
                        Status = status,
                        Metadata = new System.Collections.Generic.Dictionary<string, string>
                        {
                            ["subscriptionLevel"] = "Monthly",
                        },
                        Items = new Stripe.StripeList<Stripe.SubscriptionItem>
                        {
                            Data = new System.Collections.Generic.List<Stripe.SubscriptionItem>(),
                        },
                    }
                );

        private static string EventId(string payload) =>
            System.Text.Json.JsonDocument.Parse(payload).RootElement.GetProperty("id").GetString()!;

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
                    _jobs.Object,
                    _consentDiscount.Object,
                    _stripeSubscriptions.Object,
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
        public async Task HandleWebhookAsync_WhenSameEventDeliveredTwice_AddsTokensOnce()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[] { ("userId", UserId), ("tokenAmount", "50") },
                customerEmail: "jan@example.com"
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);

            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(Billing());
            _userBillings.Setup(r => r.AddTokensAsync(UserId, 50)).Returns(Task.CompletedTask);
            _transactions
                .Setup(r => r.AddTransactionAsync(It.IsAny<TokenTransaction>()))
                .Returns(Task.CompletedTask);

            await _sut.HandleWebhookAsync(payload, signature);
            await _sut.HandleWebhookAsync(payload, signature);

            _userBillings.Verify(r => r.AddTokensAsync(UserId, 50), Times.Once);
            VerifyConfirmationEnqueued(_ => true, Times.Once());
        }

        [Fact]
        public async Task HandleWebhookAsync_WhenProcessingFails_AllowsStripeRetryToProcessEvent()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[] { ("userId", UserId), ("tokenAmount", "50") }
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);

            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(Billing());
            _userBillings
                .SetupSequence(r => r.AddTokensAsync(UserId, 50))
                .ThrowsAsync(new TimeoutException("db timeout"))
                .Returns(Task.CompletedTask);
            _transactions
                .Setup(r => r.AddTransactionAsync(It.IsAny<TokenTransaction>()))
                .Returns(Task.CompletedTask);

            await _sut.Invoking(s => s.HandleWebhookAsync(payload, signature))
                .Should()
                .ThrowAsync<TimeoutException>();
            _context.ProcessedStripeEvents.Should().BeEmpty();

            await _sut.HandleWebhookAsync(payload, signature);

            _userBillings.Verify(r => r.AddTokensAsync(UserId, 50), Times.Exactly(2));
            _context.ProcessedStripeEvents.Should().ContainSingle();
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

        private void VerifyConfirmationEnqueued(
            Func<PurchaseConfirmationDto, bool> match,
            Times times
        ) =>
            _jobs.Verify(
                j =>
                    j.Create(
                        It.Is<Job>(job =>
                            job.Type == typeof(IPurchaseConfirmationService)
                            && job.Args.Count == 1
                            && match((PurchaseConfirmationDto)job.Args[0])
                        ),
                        It.IsAny<IState>()
                    ),
                times
            );

        private void SetupTokenPurchase()
        {
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(Billing());
            _userBillings.Setup(r => r.AddTokensAsync(UserId, 500)).Returns(Task.CompletedTask);
            _transactions
                .Setup(r => r.AddTransactionAsync(It.IsAny<TokenTransaction>()))
                .Returns(Task.CompletedTask);
        }

        [Fact]
        public async Task HandleWebhookAsync_WithCompletedTokenCheckout_EnqueuesConfirmation()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[]
                {
                    ("userId", UserId),
                    ("tokenAmount", "500"),
                    ("packageName", "Pakiet 500 tokenów"),
                },
                customerEmail: "jan@example.com"
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            SetupTokenPurchase();

            await _sut.HandleWebhookAsync(payload, signature);

            VerifyConfirmationEnqueued(
                c =>
                    c.Email == "jan@example.com"
                    && c.CheckoutMode == "payment"
                    && c.PackageName == "Pakiet 500 tokenów"
                    && c.AmountTotal == 1900,
                Times.Once()
            );
        }

        [Fact]
        public async Task HandleWebhookAsync_WithCompletedSubscriptionCheckout_EnqueuesConfirmationWithoutAddingTokens()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "subscription",
                metadata: new[] { ("userId", UserId), ("packageName", "Premium") },
                customerEmail: "jan@example.com",
                amountTotal: 2900
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);

            await _sut.HandleWebhookAsync(payload, signature);

            VerifyConfirmationEnqueued(
                c => c.CheckoutMode == "subscription" && c.AmountTotal == 2900,
                Times.Once()
            );
            _userBillings.Verify(
                r => r.AddTokensAsync(It.IsAny<string>(), It.IsAny<int>()),
                Times.Never
            );
        }

        [Fact]
        public async Task HandleWebhookAsync_WithCompletedCheckoutWithoutEmail_SkipsConfirmation()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[] { ("userId", UserId), ("tokenAmount", "500") }
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            SetupTokenPurchase();

            await _sut.HandleWebhookAsync(payload, signature);

            VerifyConfirmationEnqueued(_ => true, Times.Never());
            _userBillings.Verify(r => r.AddTokensAsync(UserId, 500), Times.Once);
        }

        [Fact]
        public async Task HandleWebhookAsync_WhenConfirmationCannotBeEnqueued_StillCreditsTokens()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[] { ("userId", UserId), ("tokenAmount", "500") },
                customerEmail: "jan@example.com"
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            SetupTokenPurchase();
            _jobs
                .Setup(j => j.Create(It.IsAny<Job>(), It.IsAny<IState>()))
                .Throws(new InvalidOperationException("storage down"));

            await _sut.Invoking(s => s.HandleWebhookAsync(payload, signature))
                .Should()
                .NotThrowAsync();

            _userBillings.Verify(r => r.AddTokensAsync(UserId, 500), Times.Once);
        }

        [Fact]
        public async Task HandleWebhookAsync_WithCompletedSubscriptionCheckout_PassesSubscriptionIdToConfirmation()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "subscription",
                metadata: new[] { ("userId", UserId), ("packageName", "Premium") },
                customerEmail: "jan@example.com",
                amountTotal: 0,
                subscriptionId: "sub_123"
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            SetupStripeSubscription("sub_123", "active");

            await _sut.HandleWebhookAsync(payload, signature);

            VerifyConfirmationEnqueued(c => c.SubscriptionId == "sub_123", Times.Once());
        }

        // ---------- Koniec triala a termin na odstąpienie ----------

        private void SetupTrialingSubscription(string subscriptionId, DateTime trialEndUtc) =>
            _stripeSubscriptions
                .Setup(s =>
                    s.GetAsync(
                        subscriptionId,
                        It.IsAny<Stripe.SubscriptionGetOptions>(),
                        It.IsAny<Stripe.RequestOptions>(),
                        It.IsAny<System.Threading.CancellationToken>()
                    )
                )
                .ReturnsAsync(
                    new Stripe.Subscription
                    {
                        Id = subscriptionId,
                        Status = "trialing",
                        TrialEnd = trialEndUtc,
                    }
                );

        private string TrialCheckoutPayload() =>
            StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "subscription",
                metadata: new[] { ("userId", UserId), ("packageName", "Premium") },
                customerEmail: "jan@example.com",
                amountTotal: 0,
                subscriptionId: "sub_trial"
            );

        [Fact]
        public async Task HandleWebhookAsync_TrialEndingBeforeWithdrawalDeadline_IsExtendedToDeadline()
        {
            var payload = TrialCheckoutPayload();
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            // Stripe: trial kończy się dokładnie 14 dni po starcie, o tej samej godzinie
            SetupTrialingSubscription("sub_trial", DateTime.UtcNow.AddDays(14));
            Stripe.SubscriptionUpdateOptions? update = null;
            _stripeSubscriptions
                .Setup(s =>
                    s.UpdateAsync(
                        "sub_trial",
                        It.IsAny<Stripe.SubscriptionUpdateOptions>(),
                        It.IsAny<Stripe.RequestOptions>(),
                        It.IsAny<System.Threading.CancellationToken>()
                    )
                )
                .Callback<
                    string,
                    Stripe.SubscriptionUpdateOptions,
                    Stripe.RequestOptions,
                    System.Threading.CancellationToken
                >((_, options, _, _) => update = options)
                .ReturnsAsync(new Stripe.Subscription { Id = "sub_trial" });

            await _sut.HandleWebhookAsync(payload, signature);

            var expectedDeadline = WithdrawalPeriodCalculator.GetDeadlineUtc(
                VerifyConfirmationDate()
            );
            update.Should().NotBeNull();
            update!.ProrationBehavior.Should().Be("none");
            ((DateTime?)update.TrialEnd!.Value).Should().Be(expectedDeadline);
        }

        [Fact]
        public async Task HandleWebhookAsync_TrialAlreadyAfterWithdrawalDeadline_IsNotChanged()
        {
            var payload = TrialCheckoutPayload();
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            SetupTrialingSubscription("sub_trial", DateTime.UtcNow.AddDays(20));

            await _sut.HandleWebhookAsync(payload, signature);

            _stripeSubscriptions.Verify(
                s =>
                    s.UpdateAsync(
                        It.IsAny<string>(),
                        It.IsAny<Stripe.SubscriptionUpdateOptions>(),
                        It.IsAny<Stripe.RequestOptions>(),
                        It.IsAny<System.Threading.CancellationToken>()
                    ),
                Times.Never
            );
            VerifyConfirmationEnqueued(c => c.SubscriptionId == "sub_trial", Times.Once());
        }

        [Fact]
        public async Task HandleWebhookAsync_WhenTrialExtensionFails_DoesNotSendConfirmationAndAllowsRetry()
        {
            var payload = TrialCheckoutPayload();
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            SetupTrialingSubscription("sub_trial", DateTime.UtcNow.AddDays(14));
            _stripeSubscriptions
                .Setup(s =>
                    s.UpdateAsync(
                        "sub_trial",
                        It.IsAny<Stripe.SubscriptionUpdateOptions>(),
                        It.IsAny<Stripe.RequestOptions>(),
                        It.IsAny<System.Threading.CancellationToken>()
                    )
                )
                .ThrowsAsync(new Stripe.StripeException("Stripe down"));

            await _sut.Invoking(s => s.HandleWebhookAsync(payload, signature))
                .Should()
                .ThrowAsync<Stripe.StripeException>();

            VerifyConfirmationEnqueued(_ => true, Times.Never());
            _context.ChangeTracker.Clear();
            _context.ProcessedStripeEvents.Should().BeEmpty();
        }

        /// <summary>Data zawarcia umowy przekazana do potwierdzenia (= moment eventu).</summary>
        private DateTime VerifyConfirmationDate()
        {
            var job = _jobs
                .Invocations.Where(i => i.Method.Name == nameof(IBackgroundJobClient.Create))
                .Select(i => (Job)i.Arguments[0])
                .Single();
            return ((PurchaseConfirmationDto)job.Args[0]).PurchasedAtUtc;
        }

        [Fact]
        public async Task HandleWebhookAsync_WithConsentDiscountTokenCheckout_MarksDiscountRedeemed()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[]
                {
                    ("userId", UserId),
                    ("tokenAmount", "500"),
                    ("packageName", "Personal"),
                    (CheckoutMetadataKeys.ConsentDiscount, "true"),
                }
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(Billing());
            _userBillings.Setup(r => r.AddTokensAsync(UserId, 500)).Returns(Task.CompletedTask);
            _transactions
                .Setup(r => r.AddTransactionAsync(It.IsAny<TokenTransaction>()))
                .Returns(Task.CompletedTask);
            _consentDiscount.Setup(d => d.MarkRedeemedAsync(UserId)).Returns(Task.CompletedTask);

            await _sut.HandleWebhookAsync(payload, signature);

            _consentDiscount.Verify(d => d.MarkRedeemedAsync(UserId), Times.Once);
        }

        [Fact]
        public async Task HandleWebhookAsync_WithRegularTokenCheckout_DoesNotTouchConsentDiscount()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[] { ("userId", UserId), ("tokenAmount", "500") }
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(Billing());
            _userBillings.Setup(r => r.AddTokensAsync(UserId, 500)).Returns(Task.CompletedTask);
            _transactions
                .Setup(r => r.AddTransactionAsync(It.IsAny<TokenTransaction>()))
                .Returns(Task.CompletedTask);

            await _sut.HandleWebhookAsync(payload, signature);

            _consentDiscount.VerifyNoOtherCalls();
        }

        // ---------- Subskrypcje i faktury (trial) ----------

        [Theory]
        [InlineData("trialing", SubscriptionStatus.Trialing)]
        [InlineData("active", SubscriptionStatus.Active)]
        public async Task HandleWebhookAsync_SubscriptionCreated_MapsStripeStatusAndRecordsActivation(
            string stripeStatus,
            SubscriptionStatus expected
        )
        {
            var payload = StripeWebhookFactory.SubscriptionEvent(
                "customer.subscription.created",
                stripeStatus,
                customerId: "cus_1"
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            var billing = Billing();
            SetupStripeSubscription("sub_test", stripeStatus);
            _userBillings.Setup(r => r.GetUserIdByCustomerIdAsync("cus_1")).ReturnsAsync(UserId);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);
            _userBillings.Setup(r => r.UpdateAsync(billing)).Returns(Task.CompletedTask);
            _transactions
                .Setup(r => r.AddTransactionAsync(It.IsAny<TokenTransaction>()))
                .Returns(Task.CompletedTask);

            await _sut.HandleWebhookAsync(payload, signature);

            billing.SubscriptionStatus.Should().Be(expected);
            billing.StripeSubscriptionId.Should().Be("sub_test");
            _transactions.Verify(
                r =>
                    r.AddTransactionAsync(
                        It.Is<TokenTransaction>(t =>
                            t.ServiceName == "SubscriptionActivated-Monthly"
                            && t.Type == TransactionType.Purchase
                        )
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task HandleWebhookAsync_ZeroAmountInvoice_KeepsTrialingStatus()
        {
            var payload = StripeWebhookFactory.InvoicePaymentSucceeded(0, customerId: "cus_1");
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            var billing = Billing(status: SubscriptionStatus.Trialing);
            billing.StripeSubscriptionId = "sub_1";
            SetupStripeSubscription("sub_1", "trialing");
            _userBillings.Setup(r => r.GetUserIdByCustomerIdAsync("cus_1")).ReturnsAsync(UserId);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);
            _userBillings.Setup(r => r.UpdateAsync(billing)).Returns(Task.CompletedTask);

            await _sut.HandleWebhookAsync(payload, signature);

            billing.SubscriptionStatus.Should().Be(SubscriptionStatus.Trialing);
        }

        [Fact]
        public async Task HandleWebhookAsync_PaidInvoice_ActivatesSubscription()
        {
            var payload = StripeWebhookFactory.InvoicePaymentSucceeded(2900, customerId: "cus_1");
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            var billing = Billing(status: SubscriptionStatus.Trialing);
            billing.StripeSubscriptionId = "sub_1";
            SetupStripeSubscription("sub_1", "active");
            _userBillings.Setup(r => r.GetUserIdByCustomerIdAsync("cus_1")).ReturnsAsync(UserId);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);
            _userBillings.Setup(r => r.UpdateAsync(billing)).Returns(Task.CompletedTask);

            await _sut.HandleWebhookAsync(payload, signature);

            billing.SubscriptionStatus.Should().Be(SubscriptionStatus.Active);
        }

        [Fact]
        public async Task HandleWebhookAsync_LateInvoiceAfterCancellation_DoesNotRestoreAccess()
        {
            var payload = StripeWebhookFactory.InvoicePaymentSucceeded(2900, customerId: "cus_1");
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            var billing = Billing(status: SubscriptionStatus.Canceled);
            billing.StripeSubscriptionId = "sub_1";
            SetupStripeSubscription("sub_1", "canceled");
            _userBillings.Setup(r => r.GetUserIdByCustomerIdAsync("cus_1")).ReturnsAsync(UserId);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);
            _userBillings.Setup(r => r.UpdateAsync(billing)).Returns(Task.CompletedTask);

            await _sut.HandleWebhookAsync(payload, signature);

            billing.SubscriptionStatus.Should().Be(SubscriptionStatus.Canceled);
            billing.HasPremiumAccess.Should().BeFalse();
        }

        [Fact]
        public async Task HandleWebhookAsync_FailedInvoice_UsesStripeStatusInsteadOfForcingPastDue()
        {
            var payload = StripeWebhookFactory
                .InvoicePaymentSucceeded(2900, customerId: "cus_1")
                .Replace("\"invoice.payment_succeeded\"", "\"invoice.payment_failed\"");
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            var billing = Billing(status: SubscriptionStatus.Active);
            billing.StripeSubscriptionId = "sub_1";
            SetupStripeSubscription("sub_1", "past_due");
            _userBillings.Setup(r => r.GetUserIdByCustomerIdAsync("cus_1")).ReturnsAsync(UserId);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);
            _userBillings.Setup(r => r.UpdateAsync(billing)).Returns(Task.CompletedTask);

            await _sut.HandleWebhookAsync(payload, signature);

            billing.SubscriptionStatus.Should().Be(SubscriptionStatus.PastDue);
        }

        [Fact]
        public async Task CanAccessServiceAsync_WhileTrialing_SucceedsWithZeroTokens()
        {
            _serviceCosts.Setup(r => r.GetServiceCostAsync(ServiceName)).ReturnsAsync(60);
            _userBillings
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(Billing(balance: 0, status: SubscriptionStatus.Trialing));

            var act = () => _sut.CanAccessServiceAsync(UserId, ServiceName);

            await act.Should().NotThrowAsync();
        }

        [Fact]
        public async Task DeductTokensForServiceAsync_WhileTrialing_DoesNotDeductOrRecord()
        {
            _serviceCosts.Setup(r => r.GetServiceCostAsync(ServiceName)).ReturnsAsync(20);
            var billing = Billing(balance: 100, status: SubscriptionStatus.Trialing);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);

            await _sut.DeductTokensForServiceAsync(UserId, ServiceName);

            billing.TokenBalance.Should().Be(100);
            (await _context.TokenTransactions.AnyAsync()).Should().BeFalse();
        }

        // ---------- Płatności z opóźnionym rozliczeniem ----------

        [Fact]
        public async Task HandleWebhookAsync_UnpaidCompletedCheckout_SendsConfirmationWithoutTokens()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[] { ("userId", UserId), ("tokenAmount", "500") },
                customerEmail: "jan@example.com",
                paymentStatus: "unpaid"
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);

            await _sut.HandleWebhookAsync(payload, signature);

            _userBillings.Verify(
                r => r.AddTokensAsync(It.IsAny<string>(), It.IsAny<int>()),
                Times.Never
            );
            VerifyConfirmationEnqueued(_ => true, Times.Once());
        }

        [Fact]
        public async Task HandleWebhookAsync_AsyncPaymentSucceeded_CreditsTokens()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[] { ("userId", UserId), ("tokenAmount", "500") },
                eventType: "checkout.session.async_payment_succeeded"
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            SetupTokenPurchase();

            await _sut.HandleWebhookAsync(payload, signature);

            _userBillings.Verify(r => r.AddTokensAsync(UserId, 500), Times.Once);
            VerifyConfirmationEnqueued(_ => true, Times.Never());
        }

        [Fact]
        public async Task HandleWebhookAsync_AsyncPaymentFailed_DoesNotCreditTokens()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[] { ("userId", UserId), ("tokenAmount", "500") },
                paymentStatus: "unpaid",
                eventType: "checkout.session.async_payment_failed"
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);

            await _sut.HandleWebhookAsync(payload, signature);

            _userBillings.Verify(
                r => r.AddTokensAsync(It.IsAny<string>(), It.IsAny<int>()),
                Times.Never
            );
        }

        [Fact]
        public async Task HandleWebhookAsync_ConfirmationUsesCompletionTimeNotSessionOpeningTime()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "subscription",
                metadata: new[] { ("userId", UserId), ("packageName", "Premium") },
                customerEmail: "jan@example.com",
                sessionCreated: DateTimeOffset.UtcNow.AddHours(-5)
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);

            await _sut.HandleWebhookAsync(payload, signature);

            VerifyConfirmationEnqueued(
                c => c.PurchasedAtUtc > DateTime.UtcNow.AddMinutes(-1),
                Times.Once()
            );
        }

        // ---------- Rezerwacja eventów (idempotencja) ----------

        [Fact]
        public async Task HandleWebhookAsync_WhenEventClaimedRecentlyAndNotCompleted_ThrowsInProgress()
        {
            var payload = StripeWebhookFactory.GenericEvent("customer.created");
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            _context.ProcessedStripeEvents.Add(
                new ProcessedStripeEvent
                {
                    Id = EventId(payload),
                    Type = "customer.created",
                    ProcessedAt = DateTime.UtcNow.AddMinutes(-1),
                }
            );
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();

            await _sut.Invoking(s => s.HandleWebhookAsync(payload, signature))
                .Should()
                .ThrowAsync<StripeEventInProgressException>();
        }

        [Fact]
        public async Task HandleWebhookAsync_WhenClaimAbandoned_TakesOverAndProcessesEvent()
        {
            var payload = StripeWebhookFactory.CheckoutSessionCompleted(
                mode: "payment",
                metadata: new[] { ("userId", UserId), ("tokenAmount", "500") }
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            _context.ProcessedStripeEvents.Add(
                new ProcessedStripeEvent
                {
                    Id = EventId(payload),
                    Type = "checkout.session.completed",
                    ProcessedAt = DateTime.UtcNow.AddMinutes(-30),
                }
            );
            await _context.SaveChangesAsync();
            _context.ChangeTracker.Clear();
            SetupTokenPurchase();

            await _sut.HandleWebhookAsync(payload, signature);

            _userBillings.Verify(r => r.AddTokensAsync(UserId, 500), Times.Once);
            _context.ChangeTracker.Clear();
            (await _context.ProcessedStripeEvents.SingleAsync()).CompletedAt.Should().NotBeNull();
        }

        [Fact]
        public async Task HandleWebhookAsync_AfterSuccess_MarksEventCompleted()
        {
            var payload = StripeWebhookFactory.GenericEvent("customer.created");
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);

            await _sut.HandleWebhookAsync(payload, signature);

            _context.ChangeTracker.Clear();
            var processed = await _context.ProcessedStripeEvents.SingleAsync();
            processed.Id.Should().Be(EventId(payload));
            processed.CompletedAt.Should().NotBeNull();
        }

        // ---------- Kolejność eventów subskrypcji ----------

        [Fact]
        public async Task HandleWebhookAsync_LateSubscriptionUpdated_UsesCurrentStripeStatus()
        {
            var payload = StripeWebhookFactory.SubscriptionEvent(
                "customer.subscription.updated",
                "trialing",
                customerId: "cus_1",
                subscriptionId: "sub_1"
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            var billing = Billing(status: SubscriptionStatus.Canceled);
            billing.StripeSubscriptionId = "sub_1";
            SetupStripeSubscription("sub_1", "canceled");
            _userBillings.Setup(r => r.GetUserIdByCustomerIdAsync("cus_1")).ReturnsAsync(UserId);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);
            _userBillings.Setup(r => r.UpdateAsync(billing)).Returns(Task.CompletedTask);

            await _sut.HandleWebhookAsync(payload, signature);

            billing.SubscriptionStatus.Should().Be(SubscriptionStatus.Canceled);
        }

        [Theory]
        [InlineData("customer.subscription.updated")]
        [InlineData("customer.subscription.deleted")]
        public async Task HandleWebhookAsync_EventForUntrackedSubscription_DoesNotChangeStatus(
            string eventType
        )
        {
            var payload = StripeWebhookFactory.SubscriptionEvent(
                eventType,
                "canceled",
                customerId: "cus_1",
                subscriptionId: "sub_old"
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            var billing = Billing(status: SubscriptionStatus.Active);
            billing.StripeSubscriptionId = "sub_current";
            _userBillings.Setup(r => r.GetUserIdByCustomerIdAsync("cus_1")).ReturnsAsync(UserId);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);

            await _sut.HandleWebhookAsync(payload, signature);

            billing.SubscriptionStatus.Should().Be(SubscriptionStatus.Active);
            billing.StripeSubscriptionId.Should().Be("sub_current");
            _userBillings.Verify(r => r.UpdateAsync(It.IsAny<UserBilling>()), Times.Never);
        }

        [Fact]
        public async Task HandleWebhookAsync_DuplicateSubscriptionCreated_KeepsTrackedLiveSubscription()
        {
            var payload = StripeWebhookFactory.SubscriptionEvent(
                "customer.subscription.created",
                "trialing",
                customerId: "cus_1",
                subscriptionId: "sub_new"
            );
            var signature = StripeWebhookFactory.SignPayload(payload, WebhookSecret);
            var billing = Billing(status: SubscriptionStatus.Active);
            billing.StripeSubscriptionId = "sub_current";
            SetupStripeSubscription("sub_new", "trialing");
            _userBillings.Setup(r => r.GetUserIdByCustomerIdAsync("cus_1")).ReturnsAsync(UserId);
            _userBillings.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);
            _transactions
                .Setup(r => r.AddTransactionAsync(It.IsAny<TokenTransaction>()))
                .Returns(Task.CompletedTask);

            await _sut.HandleWebhookAsync(payload, signature);

            billing.StripeSubscriptionId.Should().Be("sub_current");
            billing.SubscriptionStatus.Should().Be(SubscriptionStatus.Active);
            _userBillings.Verify(r => r.UpdateAsync(It.IsAny<UserBilling>()), Times.Never);
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
