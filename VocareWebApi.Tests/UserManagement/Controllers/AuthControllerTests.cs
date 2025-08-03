using System.Threading.Tasks;
using FluentAssertions;
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
        private readonly Mock<UserRegistrationHandler> _mockRegistrationHandler;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            // Setup UserManager mock
            var userStore = new Mock<IUserStore<User>>();
            _mockUserManager = new Mock<UserManager<User>>(
                userStore.Object,
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
            var claimsFactory = new Mock<IUserClaimsPrincipalFactory<User>>();
            _mockSignInManager = new Mock<SignInManager<User>>(
                _mockUserManager.Object,
                contextAccessor.Object,
                claimsFactory.Object,
                null,
                null,
                null,
                null
            );

            _mockEmailService = new Mock<IEmailService>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockLogger = new Mock<ILogger<AuthController>>();
            _mockRegistrationHandler = new Mock<UserRegistrationHandler>(null, null);

            _controller = new AuthController(
                _mockUserManager.Object,
                _mockSignInManager.Object,
                _mockEmailService.Object,
                _mockConfiguration.Object,
                _mockLogger.Object,
                _mockRegistrationHandler.Object
            );

            // Setup HttpContext
            var httpContext = new DefaultHttpContext();
            var dataProtector = new Mock<IDataProtector>();
            var dataProtectionProvider = new Mock<IDataProtectionProvider>();
            dataProtectionProvider
                .Setup(x => x.CreateProtector(It.IsAny<string>()))
                .Returns(dataProtector.Object);

            httpContext.RequestServices = new ServiceCollection()
                .AddSingleton(dataProtectionProvider.Object)
                .BuildServiceProvider();

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
                .ReturnsAsync((User)null!);

            _mockUserManager
                .Setup(x => x.CreateAsync(It.IsAny<User>(), registerDto.Password))
                .ReturnsAsync(IdentityResult.Success);

            _mockRegistrationHandler
                .Setup(x => x.HandleUserRegistrationAsync(It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            dynamic response = okResult.Value!;

            Assert.Equal("User registered successfully", response.message);
            _mockRegistrationHandler.Verify(
                x => x.HandleUserRegistrationAsync(It.IsAny<string>()),
                Times.Once
            );
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
            var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            dynamic response = badRequestResult.Value!;

            Assert.Equal("User with this email already exists.", response.message);
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

            _mockSignInManager
                .Setup(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, true))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            dynamic response = okResult.Value!;

            Assert.Equal("Login successful", response.message);
            Assert.Equal(user.Id, response.userId);
            Assert.Equal(user.Email, response.email);
            Assert.NotNull(response.token);
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

            _mockSignInManager
                .Setup(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, true))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            dynamic response = badRequestResult.Value!;

            Assert.Equal("Invalid email or password.", response.message);
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
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
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
            // Arrange (dla bezpieczeństwa zawsze zwracamy OK)
            var dto = new ForgotPasswordDto { Email = "nonexistent@example.com" };

            _mockUserManager.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync((User)null!);

            // Act
            var result = await _controller.ForgotPassword(dto);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            dynamic response = okResult.Value!;

            Assert.Equal(
                "If entered email is registered, a reset link will be sent.",
                response.message
            );
            _mockEmailService.Verify(
                x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
                Times.Never
            );
        }
    }
}
