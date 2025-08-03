using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using VocareWebAPI.UserManagement.Services.Implementations;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Services
{
    public class EmailServiceTests
    {
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<ILogger<EmailService>> _mockLogger;
        private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;
        private readonly EmailService _emailService;

        public EmailServiceTests()
        {
            _mockConfiguration = new Mock<IConfiguration>();
            _mockLogger = new Mock<ILogger<EmailService>>();

            // Setup configuration
            _mockConfiguration.Setup(x => x["Resend:ApiKey"]).Returns("test-api-key");
            _mockConfiguration.Setup(x => x["Resend:FromEmail"]).Returns("noreply@vocare.pl");
            _mockConfiguration.Setup(x => x["Resend:FromName"]).Returns("Vocare Team");

            // Setup HttpClient mock
            _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            var httpClient = new HttpClient(_mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://api.resend.com/"),
            };

            var httpClientFactory = new Mock<IHttpClientFactory>();
            httpClientFactory.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(httpClient);

            _emailService = new EmailService(
                _mockConfiguration.Object,
                _mockLogger.Object,
                httpClientFactory.Object
            );
        }

        [Fact]
        public async Task SendEmailAsync_ValidEmail_SendsSuccessfully()
        {
            // Arrange
            var to = "test@example.com";
            var subject = "Test Subject";
            var body = "Test email body";

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(
                    new HttpResponseMessage
                    {
                        StatusCode = HttpStatusCode.OK,
                        Content = new StringContent("{\"id\":\"email-123\"}"),
                    }
                );

            // Act
            await _emailService.SendEmailAsync(to, subject, body);

            // Assert
            _mockHttpMessageHandler
                .Protected()
                .Verify(
                    "SendAsync",
                    Times.Once(),
                    ItExpr.Is<HttpRequestMessage>(req =>
                        req.Method == HttpMethod.Post
                        && req.RequestUri!.ToString().Contains("emails")
                    ),
                    ItExpr.IsAny<CancellationToken>()
                );
        }

        [Fact]
        public async Task SendEmailAsync_ApiError_ThrowsHttpRequestException()
        {
            // Arrange
            var to = "test@example.com";
            var subject = "Test Subject";
            var body = "Test email body";

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(
                    new HttpResponseMessage
                    {
                        StatusCode = HttpStatusCode.BadRequest,
                        Content = new StringContent("{\"error\":\"Invalid API key\"}"),
                    }
                );

            // Act & Assert
            await Assert.ThrowsAsync<HttpRequestException>(
                () => _emailService.SendEmailAsync(to, subject, body)
            );
        }
    }
}
