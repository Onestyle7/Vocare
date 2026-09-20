using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using VocareWebApi.Tests.Common;
using VocareWebAPI.UserManagement.Services.Implementations;
using Xunit;

namespace VocareWebApi.Tests.UserManagement.Services
{
    /// <summary>Testy jednostkowe <see cref="EmailService"/> (klient Resend).</summary>
    public sealed class EmailServiceTests
    {
        private static EmailService CreateSut(FakeHttpMessageHandler handler)
        {
            var factory = new Mock<IHttpClientFactory>();
            factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient(handler));

            return new EmailService(
                TestConfiguration.FromValues(
                    ("Resend:ApiKey", "re_test"),
                    ("Resend:FromEmail", "noreply@vocare.pl")
                ),
                NullLogger<EmailService>.Instance,
                factory.Object
            );
        }

        [Fact]
        public void Constructor_WhenApiKeyMissing_Throws()
        {
            var factory = new Mock<IHttpClientFactory>();

            var act = () =>
                new EmailService(
                    TestConfiguration.FromValues(),
                    NullLogger<EmailService>.Instance,
                    factory.Object
                );

            act.Should().Throw<InvalidOperationException>();
        }

        [Fact]
        public async Task SendEmailAsync_WhenResendAccepts_CompletesAndPostsToEmailsEndpoint()
        {
            var handler = FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{\"id\":\"e_1\"}");

            await CreateSut(handler)
                .Invoking(s => s.SendEmailAsync("to@example.com", "Subject", "Body line 1\nLine 2"))
                .Should()
                .NotThrowAsync();

            handler.LastRequest!.RequestUri!.ToString().Should().EndWith("/emails");
            handler.LastRequestBody.Should().Contain("to@example.com").And.Contain("Subject");
        }

        [Fact]
        public async Task SendEmailAsync_WhenResendRejects_ThrowsHttpRequestException()
        {
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.UnprocessableEntity,
                "{\"message\":\"invalid from\"}"
            );

            await CreateSut(handler)
                .Invoking(s => s.SendEmailAsync("to@example.com", "Subject", "Body"))
                .Should()
                .ThrowAsync<HttpRequestException>();
        }
    }
}
