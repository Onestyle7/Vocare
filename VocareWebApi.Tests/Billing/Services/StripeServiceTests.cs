using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.Billing.Configuration;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Dtos;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Implementations;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Services.Interfaces;
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
        private readonly Mock<ITokenTransactionRepository> _transactions = new(MockBehavior.Strict);
        private readonly Mock<IConsentDiscountService> _consentDiscount = new(MockBehavior.Strict);

        // Domyślnie brak wcześniejszego konta na ten e-mail (Loose zwraca null)
        private readonly Mock<IPriorAccountService> _priorAccount = new();
        private readonly Mock<Stripe.SubscriptionService> _stripeSubscriptions = new(
            MockBehavior.Strict
        );
        private readonly Mock<Stripe.Checkout.SessionService> _checkoutSessions = new(
            MockBehavior.Strict
        );
        private readonly StripeService _sut;

        public StripeServiceTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _sut = CreateSut(trialPeriodDays: 14);
        }

        private StripeService CreateSut(int trialPeriodDays) =>
            new(
                _userBillings.Object,
                BuildConfiguration(),
                NullLogger<StripeService>.Instance,
                _context,
                _transactions.Object,
                Options.Create(new TrialConfig { TrialPeriodDays = trialPeriodDays }),
                _consentDiscount.Object,
                _priorAccount.Object,
                _stripeSubscriptions.Object,
                _checkoutSessions.Object
            );

        private void SetupStripeSubscriptions(params string[] statuses) =>
            _stripeSubscriptions
                .Setup(s =>
                    s.ListAsync(
                        It.Is<Stripe.SubscriptionListOptions>(o =>
                            o.Customer == "cus_1" && o.Status == "all"
                        ),
                        It.IsAny<Stripe.RequestOptions>(),
                        It.IsAny<System.Threading.CancellationToken>()
                    )
                )
                .ReturnsAsync(
                    new Stripe.StripeList<Stripe.Subscription>
                    {
                        Data = statuses
                            .Select(
                                (status, i) =>
                                    new Stripe.Subscription { Id = $"sub_{i}", Status = status }
                            )
                            .ToList(),
                    }
                );

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

        [Fact]
        public async Task CreateCheckoutSessionForSubscriptionAsync_WhenTrialing_ThrowsConflict()
        {
            _userBillings
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(Billing(customerId: "cus_1", status: SubscriptionStatus.Trialing));

            await _sut.Invoking(s =>
                    s.CreateCheckoutSessionForSubscriptionAsync(UserId, ActiveSubPriceId)
                )
                .Should()
                .ThrowAsync<SubscriptionAlreadyActiveException>();
        }

        [Theory]
        [InlineData("trialing")]
        [InlineData("active")]
        [InlineData("past_due")]
        [InlineData("incomplete")]
        public async Task CreateCheckoutSessionForSubscriptionAsync_WhenStripeHasLiveSubscriptionNotYetInDb_ThrowsConflict(
            string stripeStatus
        )
        {
            // Webhook jeszcze nie dotarł – w naszej bazie brak subskrypcji
            _userBillings
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(Billing(customerId: "cus_1"));
            SetupStripeSubscriptions("canceled", stripeStatus);

            await _sut.Invoking(s =>
                    s.CreateCheckoutSessionForSubscriptionAsync(UserId, ActiveSubPriceId)
                )
                .Should()
                .ThrowAsync<SubscriptionAlreadyActiveException>();
            _checkoutSessions.VerifyNoOtherCalls();
        }

        // ---------- GetTrialDaysAsync ----------

        [Theory]
        [InlineData(14, false, 14)]
        [InlineData(14, true, null)]
        [InlineData(0, false, null)]
        [InlineData(0, true, null)]
        public async Task GetTrialDaysAsync_GrantsTrialOnlyWhenEnabledAndNoPreviousSubscription(
            int configuredDays,
            bool hadSubscription,
            int? expected
        )
        {
            _transactions
                .Setup(t => t.HasEverHadSubscriptionAsync(UserId))
                .ReturnsAsync(hadSubscription);

            var result = await CreateSut(configuredDays).GetTrialDaysAsync(UserId);

            result.Should().Be(expected);
        }

        [Theory]
        [InlineData(true, null)]
        [InlineData(false, 14)]
        public async Task GetTrialDaysAsync_WhenPriorAccountWithSameEmail_GrantsTrialOnlyIfItHadNoSubscription(
            bool priorHadSubscription,
            int? expected
        )
        {
            _transactions.Setup(t => t.HasEverHadSubscriptionAsync(UserId)).ReturnsAsync(false);
            _priorAccount
                .Setup(p => p.GetPriorAccountAsync(UserId))
                .ReturnsAsync(
                    new AccountAntiAbuseRegistry
                    {
                        EmailHash = "hash",
                        UserId = "deleted-user",
                        HadSubscription = priorHadSubscription,
                    }
                );

            var result = await _sut.GetTrialDaysAsync(UserId);

            result.Should().Be(expected);
        }

        [Fact]
        public async Task GetTrialDaysAsync_WhenTrialDisabled_DoesNotQueryTransactions()
        {
            var result = await CreateSut(trialPeriodDays: 0).GetTrialDaysAsync(UserId);

            result.Should().BeNull();
            _transactions.VerifyNoOtherCalls();
        }

        // ---------- GetTrialSummaryAsync ----------

        [Fact]
        public async Task GetTrialSummaryAsync_WhenNotTrialing_ReturnsNullWithoutCallingStripe()
        {
            _userBillings
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(
                    new UserBilling
                    {
                        UserId = UserId,
                        SubscriptionStatus = SubscriptionStatus.Active,
                        StripeSubscriptionId = "sub_1",
                    }
                );

            var result = await _sut.GetTrialSummaryAsync(UserId);

            result.Should().BeNull();
            _stripeSubscriptions.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task GetTrialSummaryAsync_WhenTrialing_ReturnsTrialEndAndRecurringPrice()
        {
            var trialEnd = new DateTime(2026, 11, 17, 0, 0, 0, DateTimeKind.Utc);
            _userBillings
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(
                    new UserBilling
                    {
                        UserId = UserId,
                        SubscriptionStatus = SubscriptionStatus.Trialing,
                        StripeSubscriptionId = "sub_1",
                    }
                );
            _stripeSubscriptions
                .Setup(s =>
                    s.GetAsync(
                        "sub_1",
                        It.IsAny<Stripe.SubscriptionGetOptions>(),
                        It.IsAny<Stripe.RequestOptions>(),
                        It.IsAny<System.Threading.CancellationToken>()
                    )
                )
                .ReturnsAsync(
                    new Stripe.Subscription
                    {
                        Id = "sub_1",
                        TrialEnd = trialEnd,
                        CancelAtPeriodEnd = true,
                        Items = new Stripe.StripeList<Stripe.SubscriptionItem>
                        {
                            Data = new List<Stripe.SubscriptionItem>
                            {
                                new()
                                {
                                    Price = new Stripe.Price
                                    {
                                        UnitAmount = 6900,
                                        Currency = "pln",
                                        Recurring = new Stripe.PriceRecurring
                                        {
                                            Interval = "month",
                                            IntervalCount = 3,
                                        },
                                    },
                                },
                            },
                        },
                    }
                );

            var result = await _sut.GetTrialSummaryAsync(UserId);

            result.Should().Be(new TrialSummary(trialEnd, 6900, "pln", "month", 3, true));
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

        // ---------- GetCheckoutSessionSummaryAsync ----------

        private const string SessionId = "cs_test_a1B2c3";

        private static Stripe.Checkout.Session CheckoutSession(
            string mode = "payment",
            long? amountTotal = 2499,
            string? ownerId = UserId,
            string? subscriptionStatus = null
        ) =>
            new()
            {
                Id = SessionId,
                Status = "complete",
                PaymentStatus = mode == "subscription" ? "no_payment_required" : "paid",
                Mode = mode,
                AmountTotal = amountTotal,
                Currency = "pln",
                Metadata = ownerId is null
                    ? new Dictionary<string, string>()
                    : new Dictionary<string, string>
                    {
                        ["userId"] = ownerId,
                        ["packageName"] = "Token Pack",
                    },
                LineItems = new Stripe.StripeList<Stripe.LineItem>
                {
                    Data = [new Stripe.LineItem { Price = new Stripe.Price { Id = TokenPriceId } }],
                },
                Subscription = subscriptionStatus is null
                    ? null
                    : new Stripe.Subscription { Id = "sub_1", Status = subscriptionStatus },
            };

        private void SetupGetSession(Stripe.Checkout.Session session) =>
            _checkoutSessions
                .Setup(s =>
                    s.GetAsync(
                        SessionId,
                        It.Is<Stripe.Checkout.SessionGetOptions>(o =>
                            o.Expand.Contains("line_items") && o.Expand.Contains("subscription")
                        ),
                        It.IsAny<Stripe.RequestOptions>(),
                        It.IsAny<System.Threading.CancellationToken>()
                    )
                )
                .ReturnsAsync(session);

        [Fact]
        public async Task GetCheckoutSessionSummaryAsync_PaidTokenPurchase_MapsSummary()
        {
            SetupGetSession(CheckoutSession());

            var result = await _sut.GetCheckoutSessionSummaryAsync(UserId, SessionId);

            result.SessionId.Should().Be(SessionId);
            result.Status.Should().Be("complete");
            result.PaymentStatus.Should().Be("paid");
            result.Mode.Should().Be("payment");
            result.IsTrial.Should().BeFalse();
            result.AmountTotal.Should().Be(24.99m);
            result.Currency.Should().Be("PLN");
            result.PriceId.Should().Be(TokenPriceId);
            result.PackageName.Should().Be("Token Pack");
        }

        [Fact]
        public async Task GetCheckoutSessionSummaryAsync_WithConsentDiscount_ReturnsAmountAfterDiscount()
        {
            // 24.99 PLN - 25% consent discount = 18.74 PLN, as charged by Stripe
            SetupGetSession(CheckoutSession(amountTotal: 1874));

            var result = await _sut.GetCheckoutSessionSummaryAsync(UserId, SessionId);

            result.AmountTotal.Should().Be(18.74m);
        }

        [Fact]
        public async Task GetCheckoutSessionSummaryAsync_TrialSubscription_IsTrialWithZeroAmount()
        {
            SetupGetSession(
                CheckoutSession(
                    mode: "subscription",
                    amountTotal: 0,
                    subscriptionStatus: "trialing"
                )
            );

            var result = await _sut.GetCheckoutSessionSummaryAsync(UserId, SessionId);

            result.IsTrial.Should().BeTrue();
            result.AmountTotal.Should().Be(0m);
            result.Mode.Should().Be("subscription");
        }

        [Fact]
        public async Task GetCheckoutSessionSummaryAsync_PaidSubscriptionWithoutTrial_IsNotTrial()
        {
            SetupGetSession(
                CheckoutSession(
                    mode: "subscription",
                    amountTotal: 3999,
                    subscriptionStatus: "active"
                )
            );

            var result = await _sut.GetCheckoutSessionSummaryAsync(UserId, SessionId);

            result.IsTrial.Should().BeFalse();
            result.AmountTotal.Should().Be(39.99m);
        }

        [Theory]
        [InlineData("other-user")]
        [InlineData(null)]
        public async Task GetCheckoutSessionSummaryAsync_ForeignOrUnownedSession_ThrowsNotFound(
            string? ownerId
        )
        {
            SetupGetSession(CheckoutSession(ownerId: ownerId));

            var act = () => _sut.GetCheckoutSessionSummaryAsync(UserId, SessionId);

            await act.Should().ThrowAsync<CheckoutSessionNotFoundException>();
        }

        [Fact]
        public async Task GetCheckoutSessionSummaryAsync_MissingSession_ThrowsNotFound()
        {
            _checkoutSessions
                .Setup(s =>
                    s.GetAsync(
                        SessionId,
                        It.IsAny<Stripe.Checkout.SessionGetOptions>(),
                        It.IsAny<Stripe.RequestOptions>(),
                        It.IsAny<System.Threading.CancellationToken>()
                    )
                )
                .ThrowsAsync(
                    new Stripe.StripeException(
                        System.Net.HttpStatusCode.NotFound,
                        new Stripe.StripeError { Code = "resource_missing" },
                        "No such checkout.session"
                    )
                );

            var act = () => _sut.GetCheckoutSessionSummaryAsync(UserId, SessionId);

            await act.Should().ThrowAsync<CheckoutSessionNotFoundException>();
        }

        [Fact]
        public async Task GetCheckoutSessionSummaryAsync_OtherStripeError_PropagatesToGlobalHandler()
        {
            _checkoutSessions
                .Setup(s =>
                    s.GetAsync(
                        SessionId,
                        It.IsAny<Stripe.Checkout.SessionGetOptions>(),
                        It.IsAny<Stripe.RequestOptions>(),
                        It.IsAny<System.Threading.CancellationToken>()
                    )
                )
                .ThrowsAsync(new Stripe.StripeException("Stripe down"));

            var act = () => _sut.GetCheckoutSessionSummaryAsync(UserId, SessionId);

            await act.Should().ThrowAsync<Stripe.StripeException>();
        }
    }
}
