using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using VocareWebAPI.Models.Entities;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services.Implementations;
using VocareWebAPI.UserManagement.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Services
{
    /// <summary>
    /// Testy <see cref="PriorAccountService"/> – wyszukiwanie usuniętego konta o tym samym
    /// e-mailu, na podstawie którego trial i rabat za zgodę przysługują raz na osobę.
    /// </summary>
    public sealed class PriorAccountServiceTests
    {
        private const string UserId = "user-123";
        private const string Email = "jan@example.com";
        private const string EmailHash = "email-hash";

        private readonly Mock<UserManager<User>> _userManager = IdentityMocks.UserManager();
        private readonly Mock<IEmailHashService> _emailHash = new();
        private readonly Mock<IAccountAntiAbuseReporitory> _antiAbuse = new();

        private PriorAccountService CreateSut() =>
            new(_userManager.Object, _emailHash.Object, _antiAbuse.Object);

        private void SetupUser(string? email)
        {
            _userManager
                .Setup(m => m.FindByIdAsync(UserId))
                .ReturnsAsync(new User { Id = UserId, Email = email });
            _emailHash.Setup(h => h.ComputeHash(Email)).Returns(EmailHash);
        }

        [Fact]
        public async Task GetPriorAccountAsync_WhenDeletedAccountWithSameEmail_ReturnsRegistry()
        {
            SetupUser(Email);
            var registry = new AccountAntiAbuseRegistry
            {
                EmailHash = EmailHash,
                UserId = "deleted-user",
                HadSubscription = true,
            };
            _antiAbuse.Setup(r => r.GetByEmailHashAsync(EmailHash)).ReturnsAsync(registry);

            var result = await CreateSut().GetPriorAccountAsync(UserId);

            result.Should().BeSameAs(registry);
        }

        [Fact]
        public async Task GetPriorAccountAsync_WhenNoRegistryEntry_ReturnsNull()
        {
            SetupUser(Email);
            _antiAbuse
                .Setup(r => r.GetByEmailHashAsync(EmailHash))
                .ReturnsAsync((AccountAntiAbuseRegistry?)null);

            var result = await CreateSut().GetPriorAccountAsync(UserId);

            result.Should().BeNull();
        }

        [Fact]
        public async Task GetPriorAccountAsync_WhenRegistryPointsToSameUser_ReturnsNull()
        {
            SetupUser(Email);
            _antiAbuse
                .Setup(r => r.GetByEmailHashAsync(EmailHash))
                .ReturnsAsync(
                    new AccountAntiAbuseRegistry { EmailHash = EmailHash, UserId = UserId }
                );

            var result = await CreateSut().GetPriorAccountAsync(UserId);

            result.Should().BeNull();
        }

        [Fact]
        public async Task GetPriorAccountAsync_WhenUserHasNoEmail_ReturnsNullWithoutLookup()
        {
            SetupUser(email: null);

            var result = await CreateSut().GetPriorAccountAsync(UserId);

            result.Should().BeNull();
            _antiAbuse.VerifyNoOtherCalls();
        }
    }
}
