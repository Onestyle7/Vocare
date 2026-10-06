using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Models.Entities;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services.Implementations;
using VocareWebAPI.UserManagement.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Services
{
    public sealed class UserDeletionServiceTests
    {
        private const string UserId = "user-test-123";
        private const string Email = "user@example.com";
        private const string Password = "StrongPassword123!";

        private readonly Mock<UserManager<User>> _userManager = IdentityMocks.UserManager();
        private readonly Mock<IUserDataCleanupRepository> _cleanupRepo = new();
        private readonly Mock<IUserBillingRepository> _billingRepo = new();
        private readonly Mock<IEmailHashService> _emailHashService = new();
        private readonly UserDeletionService _sut;

        public UserDeletionServiceTests()
        {
            _sut = new UserDeletionService(
                _userManager.Object,
                _cleanupRepo.Object,
                _billingRepo.Object,
                _emailHashService.Object,
                NullLogger<UserDeletionService>.Instance
            );
        }

        private static User CreateValidUser(bool hasPassword = true)
        {
            return new User
            {
                Id = UserId,
                Email = Email,
                NormalizedEmail = Email.ToUpperInvariant(),
                UserName = Email,
                NormalizedUserName = Email.ToUpperInvariant(),
                PasswordHash = hasPassword ? "HashedPassword" : null,
                IsDeleted = false,
                DeletedAt = null,
            };
        }

        [Fact]
        public async Task DeleteCurrentUserAsync_WhenUserNotFound_Returns404()
        {
            _userManager.Setup(m => m.FindByIdAsync(UserId)).ReturnsAsync((User?)null);

            var result = await _sut.DeleteCurrentUserAsync(UserId, Password);

            result.IsSuccess.Should().BeFalse();
            result.Error!.Code.Should().Be("USER_NOT_FOUND");
            result.Error.StatusCode.Should().Be(404);
            _cleanupRepo.Verify(
                r => r.PurgeUserDataAsync(It.IsAny<User>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task DeleteCurrentUserAsync_WhenUserAlreadyDeleted_Returns404()
        {
            var user = CreateValidUser();
            user.IsDeleted = true;
            _userManager.Setup(m => m.FindByIdAsync(UserId)).ReturnsAsync(user);

            var result = await _sut.DeleteCurrentUserAsync(UserId, Password);

            result.IsSuccess.Should().BeFalse();
            result.Error!.Code.Should().Be("USER_NOT_FOUND");
            result.Error.StatusCode.Should().Be(404);
            _cleanupRepo.Verify(
                r => r.PurgeUserDataAsync(It.IsAny<User>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task DeleteCurrentUserAsync_WhenPasswordRequiredButEmpty_Returns400InvalidPassword()
        {
            var user = CreateValidUser(hasPassword: true);
            _userManager.Setup(m => m.FindByIdAsync(UserId)).ReturnsAsync(user);
            _userManager.Setup(m => m.HasPasswordAsync(user)).ReturnsAsync(true);

            var result = await _sut.DeleteCurrentUserAsync(UserId, password: null);

            result.IsSuccess.Should().BeFalse();
            result.Error!.Code.Should().Be("INVALID_PASSWORD");
            result.Error.StatusCode.Should().Be(400);
            _cleanupRepo.Verify(
                r => r.PurgeUserDataAsync(It.IsAny<User>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task DeleteCurrentUserAsync_WhenPasswordRequiredAndWrong_Returns400InvalidPassword()
        {
            var user = CreateValidUser(hasPassword: true);
            _userManager.Setup(m => m.FindByIdAsync(UserId)).ReturnsAsync(user);
            _userManager.Setup(m => m.HasPasswordAsync(user)).ReturnsAsync(true);
            _userManager
                .Setup(m => m.CheckPasswordAsync(user, "WrongPassword"))
                .ReturnsAsync(false);

            var result = await _sut.DeleteCurrentUserAsync(UserId, "WrongPassword");

            result.IsSuccess.Should().BeFalse();
            result.Error!.Code.Should().Be("INVALID_PASSWORD");
            result.Error.StatusCode.Should().Be(400);
            _cleanupRepo.Verify(
                r => r.PurgeUserDataAsync(It.IsAny<User>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task DeleteCurrentUserAsync_WhenEmailIsNull_Returns400EmailEmpty()
        {
            var user = CreateValidUser(hasPassword: true);
            user.Email = null;
            _userManager.Setup(m => m.FindByIdAsync(UserId)).ReturnsAsync(user);
            _userManager.Setup(m => m.HasPasswordAsync(user)).ReturnsAsync(true);
            _userManager.Setup(m => m.CheckPasswordAsync(user, Password)).ReturnsAsync(true);

            var result = await _sut.DeleteCurrentUserAsync(UserId, Password);

            result.IsSuccess.Should().BeFalse();
            result.Error!.Code.Should().Be("USER_EMAIL_IS_EMPTY");
            result.Error.StatusCode.Should().Be(400);
            _cleanupRepo.Verify(
                r => r.PurgeUserDataAsync(It.IsAny<User>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task DeleteCurrentUserAsync_WhenPasswordValidAndNoSubscription_AnonymizesAndPurgesData()
        {
            var user = CreateValidUser(hasPassword: true);
            _userManager.Setup(m => m.FindByIdAsync(UserId)).ReturnsAsync(user);
            _userManager.Setup(m => m.HasPasswordAsync(user)).ReturnsAsync(true);
            _userManager.Setup(m => m.CheckPasswordAsync(user, Password)).ReturnsAsync(true);

            _billingRepo
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ReturnsAsync(new UserBilling { UserId = UserId, StripeSubscriptionId = null });

            _emailHashService.Setup(h => h.ComputeHash(Email)).Returns("calculated-email-hash");

            _cleanupRepo
                .Setup(r => r.PurgeUserDataAsync(user, "calculated-email-hash"))
                .Returns(Task.CompletedTask);

            var result = await _sut.DeleteCurrentUserAsync(UserId, Password);

            result.IsSuccess.Should().BeTrue();
            result.Value.Should().BeTrue();

            user.IsDeleted.Should().BeTrue();
            user.DeletedAt.Should().NotBeNull();
            user.Email.Should().StartWith("deleted_").And.EndWith("@deleted.vocare.pl");
            user.UserName.Should().StartWith("deleted_");
            user.PasswordHash.Should().BeNull();
            user.SecurityStamp.Should().NotBeNullOrWhiteSpace();

            _cleanupRepo.Verify(
                r => r.PurgeUserDataAsync(user, "calculated-email-hash"),
                Times.Once
            );
        }

        [Fact]
        public async Task DeleteCurrentUserAsync_WhenOAuthUserWithoutPassword_DeletesSuccessfullyWithoutPassword()
        {
            var user = CreateValidUser(hasPassword: false);
            _userManager.Setup(m => m.FindByIdAsync(UserId)).ReturnsAsync(user);
            _userManager.Setup(m => m.HasPasswordAsync(user)).ReturnsAsync(false);

            _billingRepo
                .Setup(r => r.GetByUserIdAsync(UserId))
                .ThrowsAsync(new UserBillingNotFoundException(UserId));

            _emailHashService.Setup(h => h.ComputeHash(Email)).Returns("oauth-email-hash");
            _cleanupRepo
                .Setup(r => r.PurgeUserDataAsync(user, "oauth-email-hash"))
                .Returns(Task.CompletedTask);

            var result = await _sut.DeleteCurrentUserAsync(UserId, password: null);

            result.IsSuccess.Should().BeTrue();
            result.Value.Should().BeTrue();
            user.IsDeleted.Should().BeTrue();
            _cleanupRepo.Verify(r => r.PurgeUserDataAsync(user, "oauth-email-hash"), Times.Once);
        }
    }
}
