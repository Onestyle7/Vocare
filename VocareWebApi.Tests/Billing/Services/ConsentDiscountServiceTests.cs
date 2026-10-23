using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.Billing.Configuration;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Implementations;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.Billing.Services
{
    /// <summary>
    /// Testy <see cref="ConsentDiscountService"/> – rabat na tokeny za zgodę marketingową:
    /// jednorazowe przyznanie, ważność i wykorzystanie.
    /// </summary>
    public sealed class ConsentDiscountServiceTests
    {
        private const string UserId = "user-123";
        private const string CouponId = "coupon_consent_25";

        private readonly Mock<ITokenTransactionRepository> _transactions = new(MockBehavior.Strict);

        // Domyślnie brak wcześniejszego konta na ten e-mail (Loose zwraca null)
        private readonly Mock<IPriorAccountService> _priorAccount = new();

        private ConsentDiscountService CreateSut(string couponId = CouponId) =>
            new(
                _transactions.Object,
                _priorAccount.Object,
                Options.Create(
                    new ConsentDiscountConfig
                    {
                        CouponId = couponId,
                        PercentOff = 25,
                        ValidityDays = 7,
                    }
                ),
                NullLogger<ConsentDiscountService>.Instance
            );

        private void SetupGranted(DateTime? grantedAt) =>
            _transactions
                .Setup(t =>
                    t.GetFirstTransactionDateAsync(UserId, TransactionType.ConsentDiscountGranted)
                )
                .ReturnsAsync(grantedAt);

        private void SetupRedeemed(bool redeemed) =>
            _transactions
                .Setup(t =>
                    t.HasTransactionOfTypeAsync(UserId, TransactionType.ConsentDiscountRedeemed)
                )
                .ReturnsAsync(redeemed);

        // ---------- GrantAsync ----------

        [Fact]
        public async Task GrantAsync_OnFirstConsent_RecordsGrantAndReturnsDiscount()
        {
            _transactions
                .Setup(t =>
                    t.HasTransactionOfTypeAsync(UserId, TransactionType.ConsentDiscountGranted)
                )
                .ReturnsAsync(false);
            _transactions
                .Setup(t => t.AddTransactionAsync(It.IsAny<TokenTransaction>()))
                .Returns(Task.CompletedTask);

            var before = DateTime.UtcNow;
            var result = await CreateSut().GrantAsync(UserId);

            result.Should().NotBeNull();
            result!.CouponId.Should().Be(CouponId);
            result.PercentOff.Should().Be(25);
            result.ExpiresAtUtc.Should().BeCloseTo(before.AddDays(7), TimeSpan.FromMinutes(1));
            _transactions.Verify(
                t =>
                    t.AddTransactionAsync(
                        It.Is<TokenTransaction>(x =>
                            x.UserId == UserId
                            && x.Type == TransactionType.ConsentDiscountGranted
                            && x.Amount == 0
                        )
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task GrantAsync_WhenAlreadyGranted_DoesNotGrantAgain()
        {
            _transactions
                .Setup(t =>
                    t.HasTransactionOfTypeAsync(UserId, TransactionType.ConsentDiscountGranted)
                )
                .ReturnsAsync(true);

            var result = await CreateSut().GrantAsync(UserId);

            result.Should().BeNull();
            _transactions.Verify(
                t => t.AddTransactionAsync(It.IsAny<TokenTransaction>()),
                Times.Never
            );
        }

        [Fact]
        public async Task GrantAsync_WhenPriorAccountWithSameEmailHadDiscount_DoesNotGrant()
        {
            _transactions
                .Setup(t =>
                    t.HasTransactionOfTypeAsync(UserId, TransactionType.ConsentDiscountGranted)
                )
                .ReturnsAsync(false);
            _priorAccount
                .Setup(p => p.GetPriorAccountAsync(UserId))
                .ReturnsAsync(
                    new AccountAntiAbuseRegistry
                    {
                        EmailHash = "hash",
                        UserId = "deleted-user",
                        HadConsentDiscount = true,
                    }
                );

            var result = await CreateSut().GrantAsync(UserId);

            result.Should().BeNull();
            _transactions.Verify(
                t => t.AddTransactionAsync(It.IsAny<TokenTransaction>()),
                Times.Never
            );
        }

        [Fact]
        public async Task GrantAsync_WhenCouponNotConfigured_DoesNothing()
        {
            var result = await CreateSut(couponId: "").GrantAsync(UserId);

            result.Should().BeNull();
            _transactions.VerifyNoOtherCalls();
        }

        // ---------- GetActiveAsync ----------

        [Fact]
        public async Task GetActiveAsync_WhenGrantedRecentlyAndNotRedeemed_ReturnsDiscount()
        {
            var grantedAt = DateTime.UtcNow.AddDays(-2);
            SetupGranted(grantedAt);
            SetupRedeemed(false);

            var result = await CreateSut().GetActiveAsync(UserId);

            result.Should().NotBeNull();
            result!.ExpiresAtUtc.Should().Be(grantedAt.AddDays(7));
        }

        [Fact]
        public async Task GetActiveAsync_WhenExpired_ReturnsNull()
        {
            SetupGranted(DateTime.UtcNow.AddDays(-8));

            var result = await CreateSut().GetActiveAsync(UserId);

            result.Should().BeNull();
        }

        [Fact]
        public async Task GetActiveAsync_WhenAlreadyRedeemed_ReturnsNull()
        {
            SetupGranted(DateTime.UtcNow.AddDays(-1));
            SetupRedeemed(true);

            var result = await CreateSut().GetActiveAsync(UserId);

            result.Should().BeNull();
        }

        [Fact]
        public async Task GetActiveAsync_WhenNeverGranted_ReturnsNull()
        {
            SetupGranted(null);

            var result = await CreateSut().GetActiveAsync(UserId);

            result.Should().BeNull();
        }

        [Fact]
        public async Task GetActiveAsync_WhenCouponNotConfigured_ReturnsNullWithoutQueries()
        {
            var result = await CreateSut(couponId: " ").GetActiveAsync(UserId);

            result.Should().BeNull();
            _transactions.VerifyNoOtherCalls();
        }

        // ---------- MarkRedeemedAsync ----------

        [Fact]
        public async Task MarkRedeemedAsync_RecordsRedemption()
        {
            _transactions
                .Setup(t => t.AddTransactionAsync(It.IsAny<TokenTransaction>()))
                .Returns(Task.CompletedTask);

            await CreateSut().MarkRedeemedAsync(UserId);

            _transactions.Verify(
                t =>
                    t.AddTransactionAsync(
                        It.Is<TokenTransaction>(x =>
                            x.UserId == UserId
                            && x.Type == TransactionType.ConsentDiscountRedeemed
                            && x.Amount == 0
                        )
                    ),
                Times.Once
            );
        }
    }
}
