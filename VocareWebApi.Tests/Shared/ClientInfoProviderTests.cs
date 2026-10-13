using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.Shared.Configuration;
using VocareWebAPI.Shared.Services.Implementations;
using Xunit;

namespace VocareWebApi.Tests.Shared
{
    /// <summary>
    /// Unit tests for <see cref="ClientInfoProvider"/> – forwarded client headers must be trusted
    /// only when the request carries a valid internal API key.
    /// </summary>
    public sealed class ClientInfoProviderTests
    {
        private const string InternalKey = "test-internal-key";
        private const string ServerIp = "10.0.0.1";
        private const string ServerUserAgent = "node";
        private const string BrowserIp = "203.0.113.42";
        private const string BrowserUserAgent = "Mozilla/5.0 (Macintosh)";

        private static ClientInfoProvider CreateSut(HttpContext? httpContext)
        {
            var accessor = new Mock<IHttpContextAccessor>();
            accessor.Setup(a => a.HttpContext).Returns(httpContext);
            return new ClientInfoProvider(
                accessor.Object,
                Options.Create(new InternalApiOptions { Key = InternalKey })
            );
        }

        private static DefaultHttpContext CreateContext(
            string? internalKey = null,
            string? clientIp = null,
            string? clientUserAgent = null
        )
        {
            var context = new DefaultHttpContext();
            context.Connection.RemoteIpAddress = IPAddress.Parse(ServerIp);
            context.Request.Headers.UserAgent = ServerUserAgent;

            if (internalKey is not null)
                context.Request.Headers[ClientInfoProvider.InternalApiKeyHeader] = internalKey;
            if (clientIp is not null)
                context.Request.Headers[ClientInfoProvider.ClientIpHeader] = clientIp;
            if (clientUserAgent is not null)
                context.Request.Headers[ClientInfoProvider.ClientUserAgentHeader] = clientUserAgent;

            return context;
        }

        [Fact]
        public void GetClientInfo_WithValidKey_ReturnsForwardedValues()
        {
            var sut = CreateSut(CreateContext(InternalKey, BrowserIp, BrowserUserAgent));

            var result = sut.GetClientInfo();

            result.IpAddress.Should().Be(BrowserIp);
            result.UserAgent.Should().Be(BrowserUserAgent);
        }

        [Fact]
        public void GetClientInfo_WithInvalidKey_IgnoresForwardedValues()
        {
            var sut = CreateSut(CreateContext("wrong-key", BrowserIp, BrowserUserAgent));

            var result = sut.GetClientInfo();

            result.IpAddress.Should().Be(ServerIp);
            result.UserAgent.Should().Be(ServerUserAgent);
        }

        [Fact]
        public void GetClientInfo_WithoutKey_IgnoresForwardedValues()
        {
            var sut = CreateSut(
                CreateContext(clientIp: BrowserIp, clientUserAgent: BrowserUserAgent)
            );

            var result = sut.GetClientInfo();

            result.IpAddress.Should().Be(ServerIp);
            result.UserAgent.Should().Be(ServerUserAgent);
        }

        [Fact]
        public void GetClientInfo_WithValidKeyButNoForwardedHeaders_FallsBackToConnection()
        {
            var sut = CreateSut(CreateContext(InternalKey));

            var result = sut.GetClientInfo();

            result.IpAddress.Should().Be(ServerIp);
            result.UserAgent.Should().Be(ServerUserAgent);
        }

        [Fact]
        public void GetClientInfo_WithValidKeyAndMalformedIp_FallsBackToConnectionIp()
        {
            var sut = CreateSut(CreateContext(InternalKey, "not-an-ip", BrowserUserAgent));

            var result = sut.GetClientInfo();

            result.IpAddress.Should().Be(ServerIp);
            result.UserAgent.Should().Be(BrowserUserAgent);
        }

        [Fact]
        public void GetClientInfo_WithTooLongUserAgent_TruncatesToColumnLength()
        {
            var sut = CreateSut(CreateContext(InternalKey, BrowserIp, new string('a', 1500)));

            var result = sut.GetClientInfo();

            result.UserAgent.Should().HaveLength(1000);
        }

        [Fact]
        public void GetClientInfo_WithoutHttpContext_ReturnsUnknown()
        {
            var sut = CreateSut(null);

            var result = sut.GetClientInfo();

            result.IpAddress.Should().Be("unknown");
            result.UserAgent.Should().BeEmpty();
        }
    }
}
