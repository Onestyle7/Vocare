using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace VocareWebAPI.Extensions.ServiceCollectionExtensions
{
    public static class RateLimitingExtensions
    {
        public static IServiceCollection AddRateLimiting(
            this IServiceCollection services,
            IWebHostEnvironment env
        )
        {
            services.AddRateLimiter(options =>
            {
                options.AddFixedWindowLimiter(
                    "AiPolicy",
                    limiterOptions =>
                    {
                        limiterOptions.PermitLimit = 5;
                        limiterOptions.Window = TimeSpan.FromMinutes(1);
                        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                        limiterOptions.QueueLimit = 2;
                    }
                );

                // Polityka dla logowania
                options.AddFixedWindowLimiter(
                    "LoginPolicy",
                    limiterOptions =>
                    {
                        limiterOptions.PermitLimit =
                            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                            == "Development"
                                ? 50
                                : 20;
                        limiterOptions.Window = TimeSpan.FromMinutes(5);
                        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                        limiterOptions.QueueLimit = 3;
                    }
                );
                options.AddFixedWindowLimiter(
                    "WebhookPolicy",
                    limiterOptions =>
                    {
                        limiterOptions.PermitLimit = 100; // Stripe i tak nie wysyła więcej
                        limiterOptions.Window = TimeSpan.FromMinutes(1);
                    }
                );

                // Polityka globalna - 100 requestów na minutę
                options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
                    context =>
                        RateLimitPartition.GetFixedWindowLimiter(
                            context.User?.Identity?.IsAuthenticated == true
                                ? $"user_{context.User.Identity.Name}"
                                : $"ip_{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}",
                            factory => new FixedWindowRateLimiterOptions
                            {
                                AutoReplenishment = true,
                                PermitLimit =
                                    Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                                    == "Development"
                                        ? 300
                                        : 150,
                                Window = TimeSpan.FromMinutes(1),
                                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                                QueueLimit = 10,
                            }
                        )
                );
                options.OnRejected = async (context, token) =>
                {
                    context.HttpContext.Response.StatusCode = 429;
                    context.HttpContext.Response.Headers.Add("Retry-After", "60");

                    var response = new
                    {
                        error = "rate_limit_exceeded",
                        message = "Too many request, please try again later.",
                        retryAfterSeconds = 60,
                    };

                    await context.HttpContext.Response.WriteAsJsonAsync(
                        response,
                        cancellationToken: token
                    );
                };
            });
            return services;
        }
    }
}
