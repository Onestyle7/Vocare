using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Controllers;
using Xunit;

namespace VocareWebApi.Tests.Billing.Controllers
{
    public class BillingControllerTests
    {
        private readonly Mock<IStripeService> _mockStripeService;
        private readonly Mock<IBillingService> _mockBillingService;
        private readonly Mock<ILogger<BillingController>> _mockLogger;
        private readonly Mock<IUserBillingRepository> _mockUserBillingRepo;
        private readonly BillingController _controller;

        public BillingControllerTests()
        {
            _mockStripeService = new Mock<IStripeService>();
            _mockBillingService = new Mock<IBillingService>();
            _mockLogger = new Mock<ILogger<BillingController>>();
            _mockUserBillingRepo = new Mock<IUserBillingRepository>();

            _controller = new BillingController(
                _mockStripeService.Object,
                _mockBillingService.Object,
                _mockLogger.Object,
                _mockUserBillingRepo.Object
            );

            // Konfigurujemy użytkownika w kontrolerze
            var user = new ClaimsPrincipal(
                new ClaimsIdentity(
                    new Claim[] { new Claim(ClaimTypes.NameIdentifier, "test-user-123") },
                    "mock"
                )
            );

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user },
            };
        }

        [Fact]
        public async Task GetTokenBalance_UserExists_ReturnsOkWithBalance()
        {
            // Arrange
            var userBilling = new UserBilling { UserId = "test-user-123", TokenBalance = 50 };

            _mockBillingService
                .Setup(x => x.GetUserBillingAsync("test-user-123"))
                .ReturnsAsync(userBilling);

            // Act
            var result = await _controller.GetTokenBalance();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = okResult.Value as dynamic;

            Assert.NotNull(response);
            Assert.Equal(50, (int)response.tokenBalance);
        }

        [Fact]
        public async Task GetTokenBalance_UserNotFound_ReturnsNotFound()
        {
            // Arrange
            _mockBillingService
                .Setup(x => x.GetUserBillingAsync(It.IsAny<string>()))
                .ThrowsAsync(new KeyNotFoundException());

            // Act
            var result = await _controller.GetTokenBalance();

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal(
                "Nie znaleziono informacji o płatności dla tego użytkownika.",
                notFoundResult.Value
            );
        }

        [Fact]
        public async Task CreateCheckoutSession_ValidRequest_ReturnsOkWithUrl()
        {
            // Arrange
            var request = new CreateCheckoutSessionRequestDto { PriceId = "price_123" };
            var expectedUrl = "https://checkout.stripe.com/session123";

            _mockStripeService
                .Setup(x => x.CreateCheckoutSessionForTokenAsync("test-user-123", "price_123"))
                .ReturnsAsync(expectedUrl);

            // Act
            var result = await _controller.CreateCheckoutSession(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            dynamic response = okResult.Value!;

            Assert.Equal(expectedUrl, response.Url);
        }

        [Fact]
        public async Task CreateCheckoutSession_NullRequest_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.CreateCheckoutSession(null!);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            dynamic response = badRequestResult.Value!;

            Assert.Equal("PriceId is required.", response.Error);
        }
    }
}
