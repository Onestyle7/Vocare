using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Data;
using VocareWebAPI.Legal.Repositories.Interfaces;
using VocareWebAPI.Legal.Services.Interfaces;
using VocareWebAPI.Models.Entities;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Models.Enums;
using VocareWebAPI.UserManagement.Models.Results;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services.Implementations;
using VocareWebAPI.UserManagement.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="AuthenticationService"/> – logowanie, rejestracja oraz reset hasła.
    /// Ścieżki wymagające realnych providerów tokenów Identity są pominięte świadomie.
    /// </summary>
    public sealed class AuthenticationServiceTests : IDisposable
    {
        private const string Email = "ada@example.com";
        private const string Password = "P@ssw0rd!";

        private readonly AppDbContext _context;
        private readonly Mock<UserManager<User>> _userManager = IdentityMocks.UserManager();
        private readonly Mock<SignInManager<User>> _signInManager;
        private readonly Mock<IEmailService> _email = new();
        private readonly Mock<IMarketingConsentRepository> _marketingConsent = new();
        private readonly Mock<IUserSetupService> _userSetup = new();
        private readonly Mock<ILegalService> _legalService = new();
        private readonly Mock<ILegalRepository> _legalRepository = new();
        private readonly Mock<ITokenService> _tokenService = new();
        private readonly AuthenticationService _sut;

        public AuthenticationServiceTests()
        {
            _context = TestDbContextFactory.CreateContext();
            _signInManager = IdentityMocks.SignInManager(_userManager);

            var httpContextAccessor = new Mock<IHttpContextAccessor>();
            httpContextAccessor
                .Setup(a => a.HttpContext)
                .Returns(
                    new DefaultHttpContext
                    {
                        RequestServices = new ServiceCollection()
                            .AddSingleton<IDataProtectionProvider>(
                                DataProtectionProvider.Create("VocareTests")
                            )
                            .BuildServiceProvider(),
                    }
                );

            var httpClientFactory = new Mock<IHttpClientFactory>();
            httpClientFactory
                .Setup(f => f.CreateClient(It.IsAny<string>()))
                .Returns(
                    new HttpClient(FakeHttpMessageHandler.Throwing(new InvalidOperationException()))
                );

            _tokenService
                .Setup(t => t.GenerateToken(It.IsAny<User>(), It.IsAny<bool>(), It.IsAny<int>()))
                .Returns("test-jwt-token");

            _sut = new AuthenticationService(
                _userManager.Object,
                _signInManager.Object,
                NullLogger<AuthenticationService>.Instance,
                TestConfiguration.FromValues(("Frontend:Url", "https://vocare.pl")),
                httpClientFactory.Object,
                httpContextAccessor.Object,
                _email.Object,
                new UserRegistrationHandler(
                    _userSetup.Object,
                    NullLogger<UserRegistrationHandler>.Instance
                ),
                _marketingConsent.Object,
                _userSetup.Object,
                _legalService.Object,
                _legalRepository.Object,
                _tokenService.Object,
                _context
            );
        }

        public void Dispose() => _context.Dispose();

        private static User NewUser() =>
            new()
            {
                Id = Guid.NewGuid().ToString(),
                Email = Email,
                UserName = Email,
            };

        // ---------- LoginAsync ----------

        [Fact]
        public async Task LoginAsync_WhenUserNotFound_FailsWithInvalidCredentials401()
        {
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync((User?)null);

            var result = await _sut.LoginAsync(Email, Password);

            result.IsSuccess.Should().BeFalse();
            result.Error!.Code.Should().Be("INVALID_CREDENTIALS");
            result.Error.StatusCode.Should().Be(401);
        }

        [Fact]
        public async Task LoginAsync_WhenUserIsDeleted_FailsWithInvalidCredentials401()
        {
            var user = NewUser();
            user.IsDeleted = true;
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync(user);

            var result = await _sut.LoginAsync(Email, Password);

            result.IsSuccess.Should().BeFalse();
            result.Error!.Code.Should().Be("INVALID_CREDENTIALS");
            result.Error.StatusCode.Should().Be(401);
        }

        [Fact]
        public async Task LoginAsync_WhenPasswordWrong_FailsWithInvalidCredentials()
        {
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync(NewUser());
            _signInManager
                .Setup(m => m.CheckPasswordSignInAsync(It.IsAny<User>(), Password, true))
                .ReturnsAsync(SignInResult.Failed);

            var result = await _sut.LoginAsync(Email, Password);

            result.Error!.Code.Should().Be("INVALID_CREDENTIALS");
        }

        [Fact]
        public async Task LoginAsync_WhenLockedOut_FailsWithAccountLocked429()
        {
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync(NewUser());
            _signInManager
                .Setup(m => m.CheckPasswordSignInAsync(It.IsAny<User>(), Password, true))
                .ReturnsAsync(SignInResult.LockedOut);

            var result = await _sut.LoginAsync(Email, Password);

            result.Error!.Code.Should().Be("ACCOUNT_LOCKED");
            result.Error.StatusCode.Should().Be(429);
        }

        [Fact]
        public async Task LoginAsync_WhenCredentialsValid_ReturnsTokenAndUserData()
        {
            var user = NewUser();
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync(user);
            _signInManager
                .Setup(m => m.CheckPasswordSignInAsync(user, Password, true))
                .ReturnsAsync(SignInResult.Success);

            var result = await _sut.LoginAsync(Email, Password);

            result.IsSuccess.Should().BeTrue();
            result.Value!.UserId.Should().Be(user.Id);
            result.Value.Token.Should().NotBeNullOrEmpty();
        }

        // ---------- RegisterAsync ----------

        [Fact]
        public async Task RegisterAsync_WhenGoogleAccountExists_FailsWithGoogleAccountExists409()
        {
            var user = NewUser();
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync(user);
            _userManager
                .Setup(m => m.GetLoginsAsync(user))
                .ReturnsAsync(new List<UserLoginInfo> { new("Google", "gid", "Google") });

            var result = await _sut.RegisterAsync(Email, Password, false, null);

            result.Error!.Code.Should().Be("GOOGLE_ACCOUNT_EXISTS");
            result.Error.StatusCode.Should().Be(409);
        }

        [Fact]
        public async Task RegisterAsync_WhenPasswordAccountExists_FailsWithAccountExists409()
        {
            var user = NewUser();
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync(user);
            _userManager.Setup(m => m.GetLoginsAsync(user)).ReturnsAsync(new List<UserLoginInfo>());

            var result = await _sut.RegisterAsync(Email, Password, false, null);

            result.Error!.Code.Should().Be("ACCOUNT_EXISTS");
        }

        [Fact]
        public async Task RegisterAsync_WhenNew_CreatesUserAndRunsRegistrationHandler()
        {
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync((User?)null);
            _userManager
                .Setup(m => m.CreateAsync(It.IsAny<User>(), Password))
                .ReturnsAsync(IdentityResult.Success);
            _userSetup
                .Setup(s => s.SetupNewUserAsync(It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            var result = await _sut.RegisterAsync(Email, Password, false, null);

            result.IsSuccess.Should().BeTrue();
            _userSetup.Verify(s => s.SetupNewUserAsync(It.IsAny<string>()), Times.Once);
        }

        private void SetupSuccessfulIdentityCreation()
        {
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync((User?)null);
            _userManager
                .Setup(m => m.CreateAsync(It.IsAny<User>(), Password))
                .ReturnsAsync(IdentityResult.Success);
            _userSetup
                .Setup(s => s.SetupNewUserAsync(It.IsAny<string>()))
                .Returns(Task.CompletedTask);
        }

        [Fact]
        public async Task RegisterAsync_WithoutMarketingConsent_DoesNotGrantWelcomeTokens()
        {
            SetupSuccessfulIdentityCreation();

            var result = await _sut.RegisterAsync(Email, Password, false, null);

            result.Value!.WelcomeBonus.Should().BeNull();
            _userSetup.Verify(
                s => s.GrantOrScheduleWelcomeTokensAsync(It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task RegisterAsync_WithMarketingConsent_GrantsWelcomeTokensAndReturnsAmount()
        {
            SetupSuccessfulIdentityCreation();
            _userSetup
                .Setup(s => s.GrantOrScheduleWelcomeTokensAsync(It.IsAny<string>()))
                .ReturnsAsync(new WelcomeBonusResult(WelcomeBonusStatus.Granted, 120));

            var result = await _sut.RegisterAsync(Email, Password, true, "127.0.0.1");

            result.IsSuccess.Should().BeTrue();
            result
                .Value!.WelcomeBonus.Should()
                .Be(new WelcomeBonusResult(WelcomeBonusStatus.Granted, 120));
            _marketingConsent.Verify(
                r => r.CreateAsync(It.Is<MarketingConsent>(c => c.IsConsentGiven)),
                Times.Once
            );
        }

        [Fact]
        public async Task RegisterAsync_WhenConsentSaveFails_DoesNotGrantWelcomeTokens()
        {
            SetupSuccessfulIdentityCreation();
            _marketingConsent
                .Setup(r => r.CreateAsync(It.Is<MarketingConsent>(c => c.IsConsentGiven)))
                .ThrowsAsync(new InvalidOperationException("db down"));

            var result = await _sut.RegisterAsync(Email, Password, true, null);

            result.IsSuccess.Should().BeTrue();
            result.Value!.WelcomeBonus.Should().BeNull();
            _userSetup.Verify(
                s => s.GrantOrScheduleWelcomeTokensAsync(It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task RegisterAsync_WhenGrantIsScheduled_SucceedsWithPendingBonusAndWithoutFallbackConsent()
        {
            SetupSuccessfulIdentityCreation();
            _userSetup
                .Setup(s => s.GrantOrScheduleWelcomeTokensAsync(It.IsAny<string>()))
                .ReturnsAsync(new WelcomeBonusResult(WelcomeBonusStatus.Pending, 0));

            var result = await _sut.RegisterAsync(Email, Password, true, null);

            result.IsSuccess.Should().BeTrue();
            result
                .Value!.WelcomeBonus.Should()
                .Be(new WelcomeBonusResult(WelcomeBonusStatus.Pending, 0));
            _marketingConsent.Verify(
                r => r.CreateAsync(It.Is<MarketingConsent>(c => !c.IsConsentGiven)),
                Times.Never
            );
        }

        [Fact]
        public async Task RegisterAsync_WhenIdentityCreationFails_FailsWithRegistrationFailed()
        {
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync((User?)null);
            _userManager
                .Setup(m => m.CreateAsync(It.IsAny<User>(), Password))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "weak" }));

            var result = await _sut.RegisterAsync(Email, Password, false, null);

            result.Error!.Code.Should().Be("REGISTRATION_FAILED");
        }

        // ---------- ForgotPasswordAsync ----------

        [Fact]
        public async Task ForgotPasswordAsync_ForUnknownEmail_ReturnsGenericSuccessWithoutSendingEmail()
        {
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync((User?)null);

            var result = await _sut.ForgotPasswordAsync(Email);

            result.IsSuccess.Should().BeTrue();
            _email.Verify(
                e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task ForgotPasswordAsync_ForPasswordUser_SendsResetEmail()
        {
            var user = NewUser();
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync(user);
            _userManager.Setup(m => m.GetLoginsAsync(user)).ReturnsAsync(new List<UserLoginInfo>());
            _userManager.Setup(m => m.HasPasswordAsync(user)).ReturnsAsync(true);
            _userManager
                .Setup(m => m.GeneratePasswordResetTokenAsync(user))
                .ReturnsAsync("reset-token");

            var result = await _sut.ForgotPasswordAsync(Email);

            result.IsSuccess.Should().BeTrue();
            _email.Verify(
                e =>
                    e.SendEmailAsync(
                        Email,
                        It.Is<string>(s => s.Contains("Reset")),
                        It.IsAny<string>()
                    ),
                Times.Once
            );
        }

        // ---------- ResetPasswordAsync ----------

        [Fact]
        public async Task ResetPasswordAsync_WhenUserNotFound_FailsWithInvalidResetToken()
        {
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync((User?)null);

            var result = await _sut.ResetPasswordAsync(Email, "token", "NewP@ss1");

            result.Error!.Code.Should().Be("INVALID_RESET_TOKEN");
        }

        [Fact]
        public async Task ResetPasswordAsync_WhenPasswordTooWeak_FailsWithWeakPassword()
        {
            var user = NewUser();
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync(user);
            _userManager
                .Setup(m => m.ResetPasswordAsync(user, "token", "weak"))
                .ReturnsAsync(
                    IdentityResult.Failed(new IdentityError { Code = "PasswordTooShort" })
                );

            var result = await _sut.ResetPasswordAsync(Email, "token", "weak");

            result.Error!.Code.Should().Be("WEAK_PASSWORD");
        }

        [Fact]
        public async Task ResetPasswordAsync_WhenSuccessful_ReturnsOkAndSendsConfirmation()
        {
            var user = NewUser();
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync(user);
            _userManager
                .Setup(m => m.ResetPasswordAsync(user, "token", "NewP@ss1"))
                .ReturnsAsync(IdentityResult.Success);

            var result = await _sut.ResetPasswordAsync(Email, "token", "NewP@ss1");

            result.IsSuccess.Should().BeTrue();
            _email.Verify(
                e => e.SendEmailAsync(Email, It.IsAny<string>(), It.IsAny<string>()),
                Times.Once
            );
        }

        // ---------- ValidateResetTokenAsync ----------

        [Theory]
        [InlineData("", "e@x.com")]
        [InlineData("token", "")]
        public async Task ValidateResetTokenAsync_WithMissingInput_Fails(string token, string email)
        {
            var result = await _sut.ValidateResetTokenAsync(token, email);

            result.Error!.Code.Should().Be("MISSING_TOKEN_OR_EMAIL");
        }

        [Fact]
        public async Task ValidateResetTokenAsync_WhenUserNotFound_ReturnsInvalidButSuccessfulResult()
        {
            _userManager.Setup(m => m.FindByEmailAsync(Email)).ReturnsAsync((User?)null);

            var result = await _sut.ValidateResetTokenAsync("token", Email);

            result.IsSuccess.Should().BeTrue();
            result.Value!.IsValid.Should().BeFalse();
        }

        // ---------- RefreshAsync / OAuth guard clauses ----------

        [Fact]
        public async Task RefreshAsync_IsNotImplemented()
        {
            (await _sut.RefreshAsync("token")).Error!.Code.Should().Be("NOT_IMPLEMENTED");
        }

        [Fact]
        public async Task GoogleLoginAsync_WithNullToken_FailsWithMissingGoogleToken()
        {
            (await _sut.GoogleLoginAsync(null!)).Error!.Code.Should().Be("MISSING_GOOGLE_TOKEN");
        }

        [Theory]
        [InlineData("", "https://app/callback")]
        [InlineData("code", "")]
        public async Task LinkedInLoginAsync_WithMissingParams_Fails(
            string code,
            string redirectUri
        )
        {
            (await _sut.LinkedInLoginAsync(code, redirectUri))
                .Error!.Code.Should()
                .Be("MISSING_LINKEDIN_PARAMS");
        }
    }
}
