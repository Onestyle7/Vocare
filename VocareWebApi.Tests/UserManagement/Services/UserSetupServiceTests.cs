using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Services;
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
        private readonly Mock<ITokenTransactionRepository> _transactions = new(MockBehavior.Strict);

        private UserSetupService CreateSut(int welcomeTokens = WelcomeTokens) =>
            new(
                _billing.Object,
                Options.Create(new UserRegistrationConfig { WelcomeTokens = welcomeTokens }),
                _transactions.Object,
                NullLogger<UserSetupService>.Instance
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

            granted.Should().Be(WelcomeTokens);
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
        public async Task GrantWelcomeTokensAsync_WhenAlreadyGranted_ReturnsZeroWithoutAddingTokens()
        {
            _transactions
                .Setup(r => r.HasTransactionOfTypeAsync(UserId, TransactionType.WelcomeBonus))
                .ReturnsAsync(true);

            var granted = await CreateSut().GrantWelcomeTokensAsync(UserId);

            granted.Should().Be(0);
            _billing.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task GrantWelcomeTokensAsync_WhenConcurrentRequestGrantedFirst_ReturnsZero()
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

            granted.Should().Be(0);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-5)]
        public async Task GrantWelcomeTokensAsync_WhenWelcomeTokensDisabled_ReturnsZeroWithoutTouchingRepositories(
            int welcomeTokens
        )
        {
            var granted = await CreateSut(welcomeTokens).GrantWelcomeTokensAsync(UserId);

            granted.Should().Be(0);
            _transactions.VerifyNoOtherCalls();
            _billing.VerifyNoOtherCalls();
        }
    }
}
