using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using VocareWebAPI.Shared.Configuration;
using VocareWebAPI.Shared.Filters;
using VocareWebAPI.Shared.Services.Implementations;
using VocareWebAPI.Shared.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.Shared
{
    /// <summary>
    /// Endpoints called only by the Next.js server reject requests without a valid
    /// internal API key with 401, before the action (and any database write) runs.
    /// </summary>
    public sealed class RequireInternalApiKeyAttributeTests
    {
        private const string InternalKey = "test-internal-key";

        private static AuthorizationFilterContext Run(string? providedKey)
        {
            var httpContext = new DefaultHttpContext();
            if (providedKey is not null)
                httpContext.Request.Headers[ClientInfoProvider.InternalApiKeyHeader] = providedKey;

            var services = new ServiceCollection();
            services.AddSingleton<IHttpContextAccessor>(
                new HttpContextAccessor { HttpContext = httpContext }
            );
            services.AddSingleton(Options.Create(new InternalApiOptions { Key = InternalKey }));
            services.AddScoped<IClientInfoProvider, ClientInfoProvider>();
            httpContext.RequestServices = services.BuildServiceProvider();

            var context = new AuthorizationFilterContext(
                new ActionContext(httpContext, new RouteData(), new ActionDescriptor()),
                []
            );
            new RequireInternalApiKeyAttribute().OnAuthorization(context);
            return context;
        }

        [Fact]
        public void ValidKey_LetsRequestThrough()
        {
            Run(InternalKey).Result.Should().BeNull();
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("wrong-key")]
        public void MissingOrInvalidKey_ShortCircuitsWith401(string? providedKey)
        {
            Run(providedKey).Result.Should().BeOfType<UnauthorizedResult>();
        }
    }
}
