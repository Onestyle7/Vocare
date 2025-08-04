using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement;
using VocareWebAPI.UserManagement.Controllers;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Services.Interfaces;
using Xunit;

namespace VocareWebAPI.Tests.UserManagement.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<UserManager<User>> _mockUserManager;
        private readonly Mock<SignInManager<User>> _mockSignInManager;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<ILogger<AuthController>> _mockLogger;
        private readonly AuthController _controller;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;

        /// <summary>
        /// Fake implementacja IDataProtector dla testów
        /// </summary>
        public class FakeDataProtector : IDataProtector
        {
            public IDataProtector CreateProtector(string purpose) => this;

            public byte[] Protect(byte[] plaintext) => plaintext; // Zwraca to samo dla testów

            public byte[] Unprotect(byte[] protectedData) => protectedData; // Zwraca to samo dla testów
        }

        // ✅ Zaktualizowany konstruktor:
        public AuthControllerTests()
        {
            // Setup UserManager mock
            var userStore = new Mock<IUserStore<User>>();
            _mockUserManager = new Mock<UserManager<User>>(
                userStore.Object,
                null!,
                null!,
                null!,
                null!,
                null!,
                null!,
                null!,
                null!
            );

            // Setup SignInManager mock
            var contextAccessor = new Mock<IHttpContextAccessor>();
            var claimsFactory = new Mock<IUserClaimsPrincipalFactory<User>>();
            _mockSignInManager = new Mock<SignInManager<User>>(
                _mockUserManager.Object,
                contextAccessor.Object,
                claimsFactory.Object,
                null!,
                null!,
                null!,
                null!
            );

            _mockEmailService = new Mock<IEmailService>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockLogger = new Mock<ILogger<AuthController>>();

            // ✅ HttpClientFactory mock
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHttpClient = new HttpClient();
            _mockHttpClientFactory
                .Setup(x => x.CreateClient(It.IsAny<string>()))
                .Returns(mockHttpClient);

            // ✅ UserRegistrationHandler
            var mockUserSetupService = new Mock<IUserSetupService>();
            var mockRegistrationLogger = new Mock<ILogger<UserRegistrationHandler>>();
            UserRegistrationHandler registrationHandler = new UserRegistrationHandler(
                mockUserSetupService.Object,
                mockRegistrationLogger.Object
            );

            _controller = new AuthController(
                _mockUserManager.Object,
                _mockSignInManager.Object,
                _mockEmailService.Object,
                _mockConfiguration.Object,
                _mockLogger.Object,
                registrationHandler,
                _mockHttpClientFactory.Object
            );

            // ✅ POPRAWKA: Używamy Fake DataProtector zamiast mocka
            var httpContext = new DefaultHttpContext();

            // Fake DataProtector - nie mockujemy extension methods!
            var fakeDataProtector = new FakeDataProtector();

            var dataProtectionProvider = new Mock<IDataProtectionProvider>();
            dataProtectionProvider
                .Setup(x => x.CreateProtector(It.IsAny<string>()))
                .Returns(fakeDataProtector); // ✅ Zwracamy fake implementację

            // ServiceProvider setup
            var services = new ServiceCollection();
            services.AddSingleton(dataProtectionProvider.Object);

            httpContext.RequestServices = services.BuildServiceProvider();

            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        }

        [Fact]
        public async Task Register_ValidRequest_ReturnsOkResult()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com",
                Password = "Test123!",
                ConfirmPassword = "Test123!",
            };

            _mockUserManager
                .Setup(x => x.FindByEmailAsync(registerDto.Email))
                .ReturnsAsync((User?)null);

            _mockUserManager
                .Setup(x => x.CreateAsync(It.IsAny<User>(), registerDto.Password))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

            if (okResult.Value is string stringValue)
            {
                Assert.Equal("User registered successfully", stringValue);
            }
            else
            {
                var jsonValue = JsonSerializer.Serialize(okResult.Value);
                Assert.Contains("User registered successfully", jsonValue);
            }

            // ✅ Nie sprawdzamy UserRegistrationHandler - testujemy tylko końcowy wynik
        }

        [Fact]
        public async Task Register_UserAlreadyExists_ReturnsBadRequest()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "existing@example.com",
                Password = "Test123!",
                ConfirmPassword = "Test123!",
            };

            var existingUser = new User { Email = registerDto.Email };
            _mockUserManager
                .Setup(x => x.FindByEmailAsync(registerDto.Email))
                .ReturnsAsync(existingUser);

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);

            if (badRequestResult.Value is string stringValue)
            {
                Assert.Equal("User with this email already exists.", stringValue);
            }
            else
            {
                var jsonValue = JsonSerializer.Serialize(badRequestResult.Value);
                Assert.Contains("User with this email already exists.", jsonValue);
            }

            _mockUserManager.Verify(
                x => x.CreateAsync(It.IsAny<User>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task Login_ValidCredentials_ReturnsOkWithToken()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "Test123!",
            };

            var user = new User
            {
                Id = "user-123",
                Email = loginRequest.Email,
                UserName = loginRequest.Email,
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginRequest.Email)).ReturnsAsync(user);

            // ✅ POPRAWKA: Mock CheckPasswordSignInAsync (nie PasswordSignInAsync!)
            _mockSignInManager
                .Setup(x =>
                    x.CheckPasswordSignInAsync(
                        user,
                        loginRequest.Password,
                        true // lockoutOnFailure
                    )
                )
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

            var jsonValue = JsonSerializer.Serialize(okResult.Value);
            Assert.Contains("Login successful", jsonValue);
            Assert.Contains(user.Id, jsonValue);
            Assert.Contains(user.Email, jsonValue);
        }

        [Fact]
        public async Task Login_InvalidPassword_ReturnsBadRequest()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "WrongPassword",
            };

            var user = new User { Email = loginRequest.Email };

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginRequest.Email)).ReturnsAsync(user);

            // ✅ POPRAWKA: Mock CheckPasswordSignInAsync z Failed result
            _mockSignInManager
                .Setup(x =>
                    x.CheckPasswordSignInAsync(
                        user,
                        loginRequest.Password,
                        true // lockoutOnFailure
                    )
                )
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);

            var jsonValue = JsonSerializer.Serialize(badRequestResult.Value);
            Assert.Contains("Invalid email or password", jsonValue);
        }

        [Fact]
        public async Task ForgotPassword_ValidEmail_SendsEmailAndReturnsOk()
        {
            // Arrange
            var dto = new ForgotPasswordDto { Email = "test@example.com" };
            var user = new User
            {
                Id = "user-123",
                Email = dto.Email,
                UserName = "testuser",
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync(user);

            _mockUserManager
                .Setup(x => x.GeneratePasswordResetTokenAsync(user))
                .ReturnsAsync("reset-token");

            _mockConfiguration.Setup(x => x["Frontend:Url"]).Returns("https://vocare.pl");

            _mockEmailService
                .Setup(x =>
                    x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())
                )
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.ForgotPassword(dto);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            _mockEmailService.Verify(
                x =>
                    x.SendEmailAsync(
                        dto.Email,
                        "Reset hasła - Vocare",
                        It.Is<string>(body => body.Contains("reset-password?token="))
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task ForgotPassword_NonExistentEmail_StillReturnsOk()
        {
            // Arrange
            var dto = new ForgotPasswordDto { Email = "nonexistent@example.com" };

            _mockUserManager.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync((User?)null);

            // Act
            var result = await _controller.ForgotPassword(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

            var jsonValue = JsonSerializer.Serialize(okResult.Value);
            Assert.Contains("If entered email is registered", jsonValue);

            _mockEmailService.Verify(
                x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
                Times.Never
            );
        }
    }
}
