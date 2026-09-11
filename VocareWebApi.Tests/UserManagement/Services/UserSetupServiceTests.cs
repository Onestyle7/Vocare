using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Services;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="UserSetupService"/> – przyznawanie tokenów powitalnych
    /// nowym oraz istniejącym użytkownikom.
    /// </summary>
    public sealed class UserSetupServiceTests
    {
        private const string UserId = "user-123";
        private const int WelcomeTokens = 40;

        private readonly Mock<IUserBillingRepository> _billing = new(MockBehavior.Strict);
        private readonly UserSetupService _sut;

        public UserSetupServiceTests()
        {
            _sut = new UserSetupService(
                _billing.Object,
                Options.Create(new UserRegistrationConfig { WelcomeTokens = WelcomeTokens }),
                NullLogger<UserSetupService>.Instance
            );
        }

        [Fact]
        public async Task SetupNewUserAsync_WhenNoBillingExists_CreatesBillingWithWelcomeTokens()
        {
            _billing
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ThrowsAsync(new UserBillingNotFoundException(UserId));
            _billing
                .Setup(r => r.CreateAsync(It.IsAny<UserBilling>()))
                .ReturnsAsync((UserBilling b) => b);

            await _sut.SetupNewUserAsync(UserId);

            _billing.Verify(
                r => r.CreateAsync(It.Is<UserBilling>(b => b.TokenBalance == WelcomeTokens)),
                Times.Once
            );
        }

        [Fact]
        public async Task SetupNewUserAsync_WhenBillingHasEnoughTokens_DoesNothing()
        {
            _billing
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(new UserBilling { UserId = UserId, TokenBalance = 100 });

            await _sut.SetupNewUserAsync(UserId);

            _billing.Verify(r => r.UpdateAsync(It.IsAny<UserBilling>()), Times.Never);
            _billing.Verify(r => r.CreateAsync(It.IsAny<UserBilling>()), Times.Never);
        }

        [Fact]
        public async Task SetupNewUserAsync_WhenBillingHasFewerTokens_TopsUpToWelcomeAmount()
        {
            var billing = new UserBilling { UserId = UserId, TokenBalance = 10 };
            _billing.Setup(r => r.GetByUserIdAsync(UserId)).ReturnsAsync(billing);
            _billing.Setup(r => r.UpdateAsync(billing)).Returns(Task.CompletedTask);

            await _sut.SetupNewUserAsync(UserId);

            billing.TokenBalance.Should().Be(WelcomeTokens);
            _billing.Verify(r => r.UpdateAsync(billing), Times.Once);
        }
    }
}
