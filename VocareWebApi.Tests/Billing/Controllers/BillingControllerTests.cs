using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using VocareWebAPI.Billing.Models.Dtos;
using VocareWebAPI.Billing.Models.Entities;
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
        private readonly BillingController _controller;

        public BillingControllerTests()
        {
            // Arrange - inicjalizacja mocków
            _mockStripeService = new Mock<IStripeService>();
            _mockBillingService = new Mock<IBillingService>();
            _mockLogger = new Mock<ILogger<BillingController>>();

            // Tworzenie instancji kontrolera z mockami
            _controller = new BillingController(
                _mockStripeService.Object,
                _mockBillingService.Object,
                _mockLogger.Object
            );

            // Konfiguracja kontekstu HTTP z użytkownikiem
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
            var expectedBalance = 50;
            var userBilling = new UserBilling
            {
                UserId = "test-user-123",
                TokenBalance = expectedBalance,
            };

            _mockBillingService
                .Setup(x => x.GetUserBillingAsync("test-user-123"))
                .ReturnsAsync(userBilling);

            // Act
            var result = await _controller.GetTokenBalance();

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;
            okResult.Should().NotBeNull();

            var response = okResult!.Value;
            response.Should().NotBeNull();

            // Używamy reflection do sprawdzenia właściwości anonimowego typu
            var tokenBalanceProperty = response!.GetType().GetProperty("tokenBalance");
            tokenBalanceProperty.Should().NotBeNull();
            var actualBalance = tokenBalanceProperty!.GetValue(response);
            actualBalance.Should().Be(expectedBalance);

            // Weryfikacja, że metoda została wywołana dokładnie raz
            _mockBillingService.Verify(x => x.GetUserBillingAsync("test-user-123"), Times.Once);
        }

        [Fact]
        public async Task GetTokenBalance_UserNotFound_ReturnsNotFound()
        {
            // Arrange
            _mockBillingService
                .Setup(x => x.GetUserBillingAsync(It.IsAny<string>()))
                .ThrowsAsync(new KeyNotFoundException("User billing not found"));

            // Act
            var result = await _controller.GetTokenBalance();

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
            var notFoundResult = result as NotFoundObjectResult;
            notFoundResult!
                .Value.Should()
                .Be("Nie znaleziono informacji o płatności dla tego użytkownika.");
        }

        [Fact]
        public async Task GetTokenBalance_NoUserIdInToken_ReturnsBadRequest()
        {
            // Arrange - kontroler bez użytkownika w kontekście
            var controllerWithoutUser = new BillingController(
                _mockStripeService.Object,
                _mockBillingService.Object,
                _mockLogger.Object
            );

            controllerWithoutUser.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() },
            };

            // Act
            var result = await controllerWithoutUser.GetTokenBalance();

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
            var badRequestResult = result as BadRequestObjectResult;
            badRequestResult!.Value.Should().Be("Brak identyfikatora użytkownika w tokenie.");
        }

        [Fact]
        public async Task GetTokenBalance_UnexpectedException_ReturnsInternalServerError()
        {
            // Arrange
            _mockBillingService
                .Setup(x => x.GetUserBillingAsync(It.IsAny<string>()))
                .ThrowsAsync(new Exception("Unexpected error"));

            // Act
            var result = await _controller.GetTokenBalance();

            // Assert
            result.Should().BeOfType<ObjectResult>();
            var objectResult = result as ObjectResult;
            objectResult!.StatusCode.Should().Be(500);
            objectResult.Value.Should().Be("Wystąpił błąd podczas przetwarzania żądania.");
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
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;

            var urlProperty = okResult!.Value!.GetType().GetProperty("Url");
            urlProperty.Should().NotBeNull();
            var actualUrl = urlProperty!.GetValue(okResult.Value);
            actualUrl.Should().Be(expectedUrl);

            // Weryfikacja wywołania
            _mockStripeService.Verify(
                x => x.CreateCheckoutSessionForTokenAsync("test-user-123", "price_123"),
                Times.Once
            );
        }

        [Fact]
        public async Task CreateCheckoutSession_NullRequest_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.CreateCheckoutSession(null!);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
            var badRequestResult = result as BadRequestObjectResult;

            var errorProperty = badRequestResult!.Value!.GetType().GetProperty("Error");
            errorProperty.Should().NotBeNull();
            var errorMessage = errorProperty!.GetValue(badRequestResult.Value);
            errorMessage.Should().Be("PriceId is required.");
        }

        [Fact]
        public async Task CreateCheckoutSession_EmptyPriceId_ReturnsBadRequest()
        {
            // Arrange
            var request = new CreateCheckoutSessionRequestDto { PriceId = "" };

            // Act
            var result = await _controller.CreateCheckoutSession(request);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
            _mockStripeService.Verify(
                x => x.CreateCheckoutSessionForTokenAsync(It.IsAny<string>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task CreateCheckoutSession_InvalidOperationException_ReturnsBadRequest()
        {
            // Arrange
            var request = new CreateCheckoutSessionRequestDto { PriceId = "price_123" };
            _mockStripeService
                .Setup(x =>
                    x.CreateCheckoutSessionForTokenAsync(It.IsAny<string>(), It.IsAny<string>())
                )
                .ThrowsAsync(new InvalidOperationException("Invalid price"));

            // Act
            var result = await _controller.CreateCheckoutSession(request);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
            var badRequestResult = result as BadRequestObjectResult;

            var errorProperty = badRequestResult!.Value!.GetType().GetProperty("Error");
            var errorMessage = errorProperty!.GetValue(badRequestResult.Value);
            errorMessage.Should().Be("Invalid price");
        }

        [Fact]
        public async Task Webhook_ValidRequest_ReturnsOk()
        {
            // Arrange
            var json = "{\"type\":\"checkout.session.completed\"}";
            var stripeSignature = "valid_signature";

            _controller.ControllerContext.HttpContext.Request.Body = new System.IO.MemoryStream(
                System.Text.Encoding.UTF8.GetBytes(json)
            );
            _controller.ControllerContext.HttpContext.Request.Headers["Stripe-Signature"] =
                stripeSignature;

            _mockBillingService
                .Setup(x => x.HandleWebhookAsync(json, stripeSignature))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Webhook();

            // Assert
            result.Should().BeOfType<OkResult>();
            _mockBillingService.Verify(
                x => x.HandleWebhookAsync(json, stripeSignature),
                Times.Once
            );
        }

        [Fact]
        public async Task Success_ReturnsOkWithMessage()
        {
            // Act
            var result = _controller.Success();

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;

            var messageProperty = okResult!.Value!.GetType().GetProperty("Message");
            var message = messageProperty!.GetValue(okResult.Value);
            message.Should().Be("Payment successful. Thank you!");
        }

        [Fact]
        public async Task Cancel_ReturnsOkWithMessage()
        {
            // Act
            var result = _controller.Cancel();

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var okResult = result as OkObjectResult;

            var messageProperty = okResult!.Value!.GetType().GetProperty("Message");
            var message = messageProperty!.GetValue(okResult.Value);
            message.Should().Be("Payment canceled.");
        }
    }
}
