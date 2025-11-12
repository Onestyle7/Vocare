using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Services.Implementations;
using VocareWebAPI.UserManagement.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Services
{
    public class AuthenticationServiceTests
    {
        private readonly Mock<UserManager<User>> _mockUserManager;
        private readonly Mock<SignInManager<User>> _mockSignInManager;
        private readonly Mock<ILogger<AuthenticationService>> _mockLogger;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<IHttpContextAccessor> _mockHttpContextAccessor;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly UserRegistrationHandler _registrationHandler;
        private readonly AuthenticationService _service;

        public AuthenticationServiceTests()
        {
            // Setup UserManager mock
            var userStoreMock = new Mock<IUserStore<User>>();
            _mockUserManager = new Mock<UserManager<User>>(
                userStoreMock.Object,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            );

            // Setup SignInManager mock
            var contextAccessor = new Mock<IHttpContextAccessor>();
            var userPrincipalFactory = new Mock<IUserClaimsPrincipalFactory<User>>();
            _mockSignInManager = new Mock<SignInManager<User>>(
                _mockUserManager.Object,
                contextAccessor.Object,
                userPrincipalFactory.Object,
                null,
                null,
                null,
                null
            );

            _mockLogger = new Mock<ILogger<AuthenticationService>>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockHttpContextAccessor = new Mock<IHttpContextAccessor>();
            _mockEmailService = new Mock<IEmailService>();

            // Setup HttpContext for token generation
            var httpContext = new DefaultHttpContext();
            httpContext.RequestServices = new Mock<IServiceProvider>().Object;
            _mockHttpContextAccessor.Setup(x => x.HttpContext).Returns(httpContext);

            // Utworzenie prawdziwej instancji UserRegistrationHandler z zamockowanymi zależnościami
            var mockUserSetupService = new Mock<IUserSetupService>();
            var mockRegistrationLogger = new Mock<ILogger<UserRegistrationHandler>>();

            // Setup: Domyślnie SetupNewUserAsync zwraca Task.CompletedTask
            mockUserSetupService
                .Setup(x => x.SetupNewUserAsync(It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            _registrationHandler = new UserRegistrationHandler(
                mockUserSetupService.Object,
                mockRegistrationLogger.Object
            );

            _service = new AuthenticationService(
                _mockUserManager.Object,
                _mockSignInManager.Object,
                _mockLogger.Object,
                _mockConfiguration.Object,
                _mockHttpClientFactory.Object,
                _mockHttpContextAccessor.Object,
                _mockEmailService.Object,
                _registrationHandler
            );
        }

        #region Login Tests
        [Fact]
        public async Task LoginAsync_ValidCredentials_ReturnsSuccessWithToken()
        {
            // ARRANGE
            var email = "test@example.com";
            var password = "ValidPassword123!";
            var user = new User { Id = "locked-user", Email = email };

            _mockUserManager.Setup(x => x.FindByEmailAsync(email)).ReturnsAsync(user);

            _mockSignInManager
                .Setup(x => x.CheckPasswordSignInAsync(user, password, true))
                .ReturnsAsync(SignInResult.LockedOut);

            // ACT
            var result = await _service.LoginAsync(email, password);

            // ASSERT
            result.IsSuccess.Should().BeFalse();
            result
                .Error.Should()
                .Contain("locked out", "użytkownik powinien dostać informację o blokadzie");
        }

        [Fact]
        public async Task LoginAsync_UserNotFound_ReturnsGenericError()
        {
            // ARRANGE
            var email = "nonexistent@example.com";
            var password = "password";

            _mockUserManager.Setup(x => x.FindByEmailAsync(email)).ReturnsAsync((User)null!);

            // ACT
            var result = await _service.LoginAsync(email, password);

            // ASSERT
            result.IsSuccess.Should().BeFalse();
            result
                .Error.Should()
                .Be(
                    "Invalid email or password.",
                    "nie możemy zdradzić czy email istnieje - bezpieczeństwo!"
                );

            // Nie próbujemy nawet sprawdzać hasła
            _mockSignInManager.Verify(
                x =>
                    x.CheckPasswordSignInAsync(
                        It.IsAny<User>(),
                        It.IsAny<string>(),
                        It.IsAny<bool>()
                    ),
                Times.Never
            );
        }

        [Fact]
        public async Task LoginAsync_WrongPassword_ReturnsFailure()
        {
            // ARRANGE
            var email = "test@example.com";
            var password = "WrongPassword";
            var user = new User { Id = "user-123", Email = email };

            _mockUserManager.Setup(x => x.FindByEmailAsync(email)).ReturnsAsync(user);

            _mockSignInManager
                .Setup(x => x.CheckPasswordSignInAsync(user, password, true))
                .ReturnsAsync(SignInResult.Failed);

            // ACT
            var result = await _service.LoginAsync(email, password);

            // ASSERT
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().Be("Invalid email or password.");
        }
        #endregion

        #region Register Tests
        [Fact]
        public async Task RegisterAsync_NewUser_CreatesUser()
        {
            // ARRANGE
            var email = "newuser@example.com";
            var password = "SecurePassword123!";

            // Mock: User nie istnieje
            _mockUserManager.Setup(x => x.FindByEmailAsync(email)).ReturnsAsync((User)null!);

            // Mock: Tworzenie użytkownika się udaje
            _mockUserManager
                .Setup(x => x.CreateAsync(It.IsAny<User>(), password))
                .ReturnsAsync(IdentityResult.Success)
                .Callback<User, string>(
                    (user, pwd) =>
                    {
                        user.Id = "new-user-123"; // Symuluj przypisanie ID
                    }
                );

            // ACT
            var result = await _service.RegisterAsync(email, password);

            // ASSERT
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.UserId.Should().NotBeNullOrEmpty();

            // Weryfikuj że user został utworzony
            _mockUserManager.Verify(
                x =>
                    x.CreateAsync(
                        It.Is<User>(u => u.Email == email && u.UserName == email),
                        password
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task RegisterAsync_EmailAlreadyExists_ReturnsFailure()
        {
            // ARRANGE
            var email = "existing@example.com";
            var password = "Password123!";
            var existingUser = new User { Id = "existing-123", Email = email };

            _mockUserManager.Setup(x => x.FindByEmailAsync(email)).ReturnsAsync(existingUser);

            // Mock: Sprawdzamy czy user ma Google login
            _mockUserManager
                .Setup(x => x.GetLoginsAsync(existingUser))
                .ReturnsAsync(new List<UserLoginInfo>());

            // ACT
            var result = await _service.RegisterAsync(email, password);

            // ASSERT
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().Contain("already exists");

            // Nie próbujemy tworzyć nowego użytkownika
            _mockUserManager.Verify(
                x => x.CreateAsync(It.IsAny<User>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task RegisterAsync_UserCreationFails_ReturnsFailure()
        {
            // ARRANGE
            var email = "test@example.com";
            var password = "Password123!";

            _mockUserManager.Setup(x => x.FindByEmailAsync(email)).ReturnsAsync((User)null!);

            // Mock: Tworzenie użytkownika się nie udaje
            _mockUserManager
                .Setup(x => x.CreateAsync(It.IsAny<User>(), password))
                .ReturnsAsync(
                    IdentityResult.Failed(new IdentityError { Description = "Password too weak" })
                );

            // ACT
            var result = await _service.RegisterAsync(email, password);

            // ASSERT
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().Contain("Registration failed");
        }

        #endregion
        #region Password Reset Tests[Fact]
        public async Task ForgotPasswordAsync_ValidEmail_SendsResetEmail()
        {
            // ARRANGE
            var email = "user@example.com";
            var user = new User
            {
                Id = "user-123",
                Email = email,
                UserName = email,
            };
            var resetToken = "reset-token-xyz";

            _mockUserManager.Setup(x => x.FindByEmailAsync(email)).ReturnsAsync(user);

            _mockUserManager
                .Setup(x => x.GetLoginsAsync(user))
                .ReturnsAsync(new List<UserLoginInfo>());

            _mockUserManager.Setup(x => x.HasPasswordAsync(user)).ReturnsAsync(true);

            _mockUserManager
                .Setup(x => x.GeneratePasswordResetTokenAsync(user))
                .ReturnsAsync(resetToken);

            _mockConfiguration.Setup(x => x["Frontend:Url"]).Returns("https://vocare.pl");

            _mockEmailService
                .Setup(x =>
                    x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())
                )
                .Returns(Task.CompletedTask);

            // ACT
            var result = await _service.ForgotPasswordAsync(email);

            // ASSERT
            result.IsSuccess.Should().BeTrue();

            // Sprawdź czy email został wysłany
            _mockEmailService.Verify(
                x =>
                    x.SendEmailAsync(
                        email,
                        It.Is<string>(s => s.Contains("Reset hasła")),
                        It.Is<string>(s => s.Contains("reset-password") && s.Contains(email))
                    ),
                Times.Once,
                "email z linkiem resetującym musi zostać wysłany"
            );
        }

        [Fact]
        public async Task ForgotPasswordAsync_NonExistentEmail_ReturnsSuccessWithoutSending()
        {
            // ARRANGE
            var email = "nonexistent@example.com";

            _mockUserManager.Setup(x => x.FindByEmailAsync(email)).ReturnsAsync((User)null!);

            // ACT
            var result = await _service.ForgotPasswordAsync(email);

            // ASSERT
            result.IsSuccess.Should().BeTrue("ze względów bezpieczeństwa zawsze zwracamy sukces");

            // Email NIE został wysłany
            _mockEmailService.Verify(
                x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
                Times.Never,
                "nie wysyłamy emaila dla nieistniejących kont"
            );
        }

        [Fact]
        public async Task ResetPasswordAsync_ValidToken_ResetsPassword()
        {
            // ARRANGE
            var email = "user@example.com";
            var token = "valid-reset-token";
            var newPassword = "NewSecurePassword123!";
            var user = new User { Id = "user-123", Email = email };

            _mockUserManager.Setup(x => x.FindByEmailAsync(email)).ReturnsAsync(user);

            _mockUserManager
                .Setup(x => x.ResetPasswordAsync(user, token, newPassword))
                .ReturnsAsync(IdentityResult.Success);

            _mockEmailService
                .Setup(x =>
                    x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())
                )
                .Returns(Task.CompletedTask);

            // ACT
            var result = await _service.ResetPasswordAsync(email, token, newPassword);

            // ASSERT
            result.IsSuccess.Should().BeTrue();
            result.Value!.Message.Should().Contain("reset successfully");

            // Weryfikuj że hasło zostało zmienione
            _mockUserManager.Verify(
                x => x.ResetPasswordAsync(user, token, newPassword),
                Times.Once
            );

            // Weryfikuj że wysłano email potwierdzający
            _mockEmailService.Verify(
                x =>
                    x.SendEmailAsync(
                        email,
                        It.Is<string>(s => s.Contains("zmienione")),
                        It.IsAny<string>()
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task ResetPasswordAsync_InvalidToken_ReturnsFailure()
        {
            // ARRANGE
            var email = "user@example.com";
            var invalidToken = "expired-or-invalid-token";
            var newPassword = "NewPassword123!";
            var user = new User { Id = "user-123", Email = email };

            _mockUserManager.Setup(x => x.FindByEmailAsync(email)).ReturnsAsync(user);

            // Mock: Token jest nieprawidłowy
            _mockUserManager
                .Setup(x => x.ResetPasswordAsync(user, invalidToken, newPassword))
                .ReturnsAsync(
                    IdentityResult.Failed(
                        new IdentityError { Code = "InvalidToken", Description = "Invalid token" }
                    )
                );

            // ACT
            var result = await _service.ResetPasswordAsync(email, invalidToken, newPassword);

            // ASSERT
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().Contain("Invalid or expired token");

            // Email NIE został wysłany (bo reset się nie udał)
            _mockEmailService.Verify(
                x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
                Times.Never
            );
        }

        #endregion
        #region Google Login Tests
        [Fact]
        public async Task GoogleLoginAsync_NewUser_CreatesAccountWithBilling()
        {
            // ARRANGE
            var accessToken = "valid-google-token";
            var email = "newgoogleuser@example.com";
            var googleUserId = "google-123";

            // ✅ 1. Mock IDataProtectionProvider (KLUCZOWE!)
            var mockDataProtector = new Mock<IDataProtector>();
            mockDataProtector
                .Setup(x => x.Protect(It.IsAny<byte[]>()))
                .Returns((byte[] data) => data); // Zwróć te same dane

            var mockDataProtectionProvider = new Mock<IDataProtectionProvider>();
            mockDataProtectionProvider
                .Setup(x => x.CreateProtector(It.IsAny<string>()))
                .Returns(mockDataProtector.Object);

            var mockServiceProvider = new Mock<IServiceProvider>();
            mockServiceProvider
                .Setup(x => x.GetService(typeof(IDataProtectionProvider)))
                .Returns(mockDataProtectionProvider.Object);

            var httpContext = new DefaultHttpContext();
            httpContext.RequestServices = mockServiceProvider.Object;

            var mockHttpContextAccessorForTest = new Mock<IHttpContextAccessor>();
            mockHttpContextAccessorForTest.Setup(x => x.HttpContext).Returns(httpContext);

            var googleTokenResponse = new
            {
                email = email,
                user_id = googleUserId,
                verified_email = true,
            };

            var jsonResponse = System.Text.Json.JsonSerializer.Serialize(googleTokenResponse);
            var httpResponse = new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json"),
            };

            var mockHttpHandler = new Mock<HttpMessageHandler>();
            mockHttpHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(httpResponse);

            var httpClient = new HttpClient(mockHttpHandler.Object);

            var mockHttpClientFactoryForTest = new Mock<IHttpClientFactory>();
            mockHttpClientFactoryForTest
                .Setup(x => x.CreateClient(It.IsAny<string>()))
                .Returns(httpClient);

            var serviceForGoogleTest = new AuthenticationService(
                _mockUserManager.Object,
                _mockSignInManager.Object,
                _mockLogger.Object,
                _mockConfiguration.Object,
                mockHttpClientFactoryForTest.Object,
                mockHttpContextAccessorForTest.Object,
                _mockEmailService.Object,
                _registrationHandler
            );

            _mockUserManager.Setup(x => x.FindByEmailAsync(email)).ReturnsAsync((User)null!);

            _mockUserManager
                .Setup(x => x.CreateAsync(It.IsAny<User>()))
                .ReturnsAsync(IdentityResult.Success)
                .Callback<User>(user => user.Id = "new-user-123");

            _mockUserManager
                .Setup(x => x.AddLoginAsync(It.IsAny<User>(), It.IsAny<UserLoginInfo>()))
                .ReturnsAsync(IdentityResult.Success);

            _mockUserManager
                .Setup(x =>
                    x.SetAuthenticationTokenAsync(
                        It.IsAny<User>(),
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<string>()
                    )
                )
                .ReturnsAsync(IdentityResult.Success);

            // ACT
            var result = await serviceForGoogleTest.GoogleLoginAsync(accessToken);

            // ASSERT
            result.IsSuccess.Should().BeTrue($"Error was: {result.Error}");
            result.Value!.IsNewUser.Should().BeTrue();
            result.Value.Email.Should().Be(email);

            // Weryfikuj że konto zostało utworzone
            _mockUserManager.Verify(
                x => x.CreateAsync(It.Is<User>(u => u.Email == email && u.EmailConfirmed == true)),
                Times.Once
            );
        }

        #endregion
    }
}
