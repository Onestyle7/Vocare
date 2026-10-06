using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Models.Entities;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Models.Enums;
using VocareWebAPI.UserManagement.Models.Results;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services;
using VocareWebAPI.UserManagement.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="UserSetupService"/> – zakładanie konta billingowego z zerowym
    /// saldem przy rejestracji oraz jednorazowe przyznanie tokenów powitalnych za zgodę marketingową.
    /// </summary>
    public sealed class UserSetupServiceTests
    {
        private const string UserId = "user-123";
        private const int WelcomeTokens = 40;
        private const string WelcomeBonusServiceName = "WelcomeBonus-MarketingConsent";

        private readonly Mock<IUserBillingRepository> _billing = new(MockBehavior.Strict);
        private readonly Mock<IAccountAntiAbuseReporitory> _antiAbuse = new();
        private readonly Mock<IEmailHashService> _emailHash = new();
        private readonly Mock<UserManager<User>> _userManager = IdentityMocks.UserManager();
        private readonly Mock<ITokenTransactionRepository> _transactions = new(MockBehavior.Strict);
        private readonly Mock<IBackgroundJobClient> _jobs = new();

        private UserSetupService CreateSut(int welcomeTokens = WelcomeTokens) =>
            new(
                _billing.Object,
                Options.Create(new UserRegistrationConfig { WelcomeTokens = welcomeTokens }),
                _transactions.Object,
                NullLogger<UserSetupService>.Instance,
                _jobs.Object,
                _antiAbuse.Object,
                _emailHash.Object,
                _userManager.Object
            );

        // ---------- SetupNewUserAsync ----------

        [Fact]
        public async Task SetupNewUserAsync_WhenNoBillingExists_CreatesBillingWithZeroBalance()
        {
            _billing
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ThrowsAsync(new UserBillingNotFoundException(UserId));
            _billing
                .Setup(r => r.CreateAsync(It.IsAny<UserBilling>()))
                .ReturnsAsync((UserBilling b) => b);

            await CreateSut().SetupNewUserAsync(UserId);

            _billing.Verify(
                r =>
                    r.CreateAsync(
                        It.Is<UserBilling>(b => b.UserId == UserId && b.TokenBalance == 0)
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task SetupNewUserAsync_WhenBillingExists_LeavesBillingUntouched()
        {
            var billing = new UserBilling { UserId = UserId, TokenBalance = 10 };
            _billing.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);

            await CreateSut().SetupNewUserAsync(UserId);

            billing.TokenBalance.Should().Be(10);
            _billing.Verify(r => r.UpdateAsync(It.IsAny<UserBilling>()), Times.Never);
            _billing.Verify(r => r.CreateAsync(It.IsAny<UserBilling>()), Times.Never);
        }

        // ---------- GrantWelcomeTokensAsync ----------

        [Fact]
        public async Task GrantWelcomeTokensAsync_WhenNotGrantedYet_AddsTokensWithWelcomeBonusEntry()
        {
            _transactions
                .Setup(r => r.HasTransactionOfTypeAsync(UserId, TransactionType.WelcomeBonus))
                .ReturnsAsync(false);
            _billing
                .Setup(r =>
                    r.AddTokensWithTransactionAsync(
                        UserId,
                        WelcomeTokens,
                        TransactionType.WelcomeBonus,
                        WelcomeBonusServiceName
                    )
                )
                .Returns(Task.CompletedTask);

            var granted = await CreateSut().GrantWelcomeTokensAsync(UserId);

            granted.Should().Be(new WelcomeBonusResult(WelcomeBonusStatus.Granted, WelcomeTokens));
            _billing.Verify(
                r =>
                    r.AddTokensWithTransactionAsync(
                        UserId,
                        WelcomeTokens,
                        TransactionType.WelcomeBonus,
                        WelcomeBonusServiceName
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task GrantWelcomeTokensAsync_WhenAlreadyGranted_ReturnsAlreadyClaimedWithoutAddingTokens()
        {
            _transactions
                .Setup(r => r.HasTransactionOfTypeAsync(UserId, TransactionType.WelcomeBonus))
                .ReturnsAsync(true);

            var granted = await CreateSut().GrantWelcomeTokensAsync(UserId);

            granted.Should().Be(new WelcomeBonusResult(WelcomeBonusStatus.AlreadyClaimed, 0));
            _billing.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task GrantWelcomeTokensAsync_WhenConcurrentRequestGrantedFirst_ReturnsAlreadyClaimed()
        {
            _transactions
                .Setup(r => r.HasTransactionOfTypeAsync(UserId, TransactionType.WelcomeBonus))
                .ReturnsAsync(false);
            _billing
                .Setup(r =>
                    r.AddTokensWithTransactionAsync(
                        UserId,
                        WelcomeTokens,
                        TransactionType.WelcomeBonus,
                        WelcomeBonusServiceName
                    )
                )
                .ThrowsAsync(new WelcomeBonusAlreadyGrantedException(UserId));

            var granted = await CreateSut().GrantWelcomeTokensAsync(UserId);

            granted.Should().Be(new WelcomeBonusResult(WelcomeBonusStatus.AlreadyClaimed, 0));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-5)]
        public async Task GrantWelcomeTokensAsync_WhenWelcomeTokensDisabled_ReturnsDisabledWithoutTouchingRepositories(
            int welcomeTokens
        )
        {
            var granted = await CreateSut(welcomeTokens).GrantWelcomeTokensAsync(UserId);

            granted.Should().Be(new WelcomeBonusResult(WelcomeBonusStatus.Disabled, 0));
            _transactions.VerifyNoOtherCalls();
            _billing.VerifyNoOtherCalls();
        }

        // ---------- GrantOrScheduleWelcomeTokensAsync ----------

        [Fact]
        public async Task GrantOrScheduleWelcomeTokensAsync_WhenGrantSucceeds_ReturnsGrantedWithoutEnqueueing()
        {
            _transactions
                .Setup(r => r.HasTransactionOfTypeAsync(UserId, TransactionType.WelcomeBonus))
                .ReturnsAsync(false);
            _billing
                .Setup(r =>
                    r.AddTokensWithTransactionAsync(
                        UserId,
                        WelcomeTokens,
                        TransactionType.WelcomeBonus,
                        WelcomeBonusServiceName
                    )
                )
                .Returns(Task.CompletedTask);

            var result = await CreateSut().GrantOrScheduleWelcomeTokensAsync(UserId);

            result.Should().Be(new WelcomeBonusResult(WelcomeBonusStatus.Granted, WelcomeTokens));
            _jobs.Verify(c => c.Create(It.IsAny<Job>(), It.IsAny<IState>()), Times.Never);
        }

        [Fact]
        public async Task GrantOrScheduleWelcomeTokensAsync_WhenGrantThrows_EnqueuesRetryAndReturnsPending()
        {
            _transactions
                .Setup(r => r.HasTransactionOfTypeAsync(UserId, TransactionType.WelcomeBonus))
                .ThrowsAsync(new InvalidOperationException("db down"));

            var result = await CreateSut().GrantOrScheduleWelcomeTokensAsync(UserId);

            result.Should().Be(new WelcomeBonusResult(WelcomeBonusStatus.Pending, 0));
            _jobs.Verify(
                c =>
                    c.Create(
                        It.Is<Job>(j =>
                            j.Type == typeof(IUserSetupService)
                            && j.Method.Name == nameof(IUserSetupService.GrantWelcomeTokensAsync)
                            && (string)j.Args[0] == UserId
                        ),
                        It.IsAny<EnqueuedState>()
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task GrantOrScheduleWelcomeTokensAsync_WhenEnqueueAlsoFails_ReturnsFailed()
        {
            _transactions
                .Setup(r => r.HasTransactionOfTypeAsync(UserId, TransactionType.WelcomeBonus))
                .ThrowsAsync(new InvalidOperationException("db down"));
            _jobs
                .Setup(c => c.Create(It.IsAny<Job>(), It.IsAny<IState>()))
                .Throws(new InvalidOperationException("hangfire down"));

            var result = await CreateSut().GrantOrScheduleWelcomeTokensAsync(UserId);

            result.Should().Be(new WelcomeBonusResult(WelcomeBonusStatus.Failed, 0));
        }

        [Fact]
        public async Task SetupNewUserAsync_WhenPriorAccountExisted_SetsZeroWelcomeTokens()
        {
            var user = new User { Id = UserId, Email = "returning@example.com" };
            _userManager.Setup(m => m.FindByIdAsync(UserId)).ReturnsAsync(user);
            _emailHash.Setup(h => h.ComputeHash(user.Email)).Returns("hashed-email");
            _antiAbuse.Setup(a => a.HasPriorBonusAsync("hashed-email")).ReturnsAsync(true);

            _billing
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ThrowsAsync(new UserBillingNotFoundException(UserId));
            _billing
                .Setup(r => r.CreateAsync(It.IsAny<UserBilling>()))
                .ReturnsAsync((UserBilling b) => b);

            await _sut.SetupNewUserAsync(UserId);

            _billing.Verify(
                r => r.CreateAsync(It.Is<UserBilling>(b => b.TokenBalance == 0)),
                Times.Once
            );
        }

        [Fact]
        public async Task SetupNewUserAsync_WhenPriorAccountExisted_SetsZeroWelcomeTokens()
        {
            var user = new User { Id = UserId, Email = "returning@example.com" };
            _userManager.Setup(m => m.FindByIdAsync(UserId)).ReturnsAsync(user);
            _emailHash.Setup(h => h.ComputeHash(user.Email)).Returns("hashed-email");
            _antiAbuse.Setup(a => a.HasPriorBonusAsync("hashed-email")).ReturnsAsync(true);

            _billing
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ThrowsAsync(new UserBillingNotFoundException(UserId));
            _billing
                .Setup(r => r.CreateAsync(It.IsAny<UserBilling>()))
                .ReturnsAsync((UserBilling b) => b);

            await _sut.SetupNewUserAsync(UserId);

            _billing.Verify(
                r => r.CreateAsync(It.Is<UserBilling>(b => b.TokenBalance == 0)),
                Times.Once
            );
        }
    }
}
