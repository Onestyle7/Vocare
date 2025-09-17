using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Extensions.ApplicationBuilderExtensions
{
    public static class MiddlewareExtensions
    {
        /// <summary>
        /// Dodaje middleware do logowania CORS requests (tylko dla debugowania)
        /// </summary>
        public static WebApplication UseCorsLoggingMiddleware(this WebApplication app)
        {
            if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
            {
                app.Use(
                    async (context, next) =>
                    {
                        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
                        var origin = context.Request.Headers["Origin"].ToString();

                        if (!string.IsNullOrEmpty(origin))
                        {
                            logger.LogDebug(
                                "CORS Request: Method={Method}, Path={Path}, Origin={Origin}",
                                context.Request.Method,
                                context.Request.Path,
                                origin
                            );
                        }

                        // Log preflight requests
                        if (context.Request.Method == "OPTIONS")
                        {
                            logger.LogDebug(
                                "Preflight request received for {Path} from {Origin}",
                                context.Request.Path,
                                origin
                            );
                        }

                        await next();

                        // Log response headers dla debugowania
                        if (!string.IsNullOrEmpty(origin))
                        {
                            var corsHeader = context
                                .Response.Headers["Access-Control-Allow-Origin"]
                                .ToString();
                            if (!string.IsNullOrEmpty(corsHeader))
                            {
                                logger.LogDebug(
                                    "CORS Response: Allow-Origin={AllowOrigin}, Status={Status}",
                                    corsHeader,
                                    context.Response.StatusCode
                                );
                            }
                        }
                    }
                );
            }

            return app;
        }

        /// <summary>
        /// Dodaje globalne error handling z obsługą CORS
        /// </summary>
        public static WebApplication UseGlobalExceptionHandling(this WebApplication app)
        {
            app.Use(
                async (context, next) =>
                {
                    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();

                    try
                    {
                        await next();
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(
                            ex,
                            "Unhandled exception for {Method} {Path}",
                            context.Request.Method,
                            context.Request.Path
                        );

                        // Upewnij się że response nie został jeszcze wysłany
                        if (!context.Response.HasStarted)
                        {
                            context.Response.StatusCode = 500;
                            context.Response.ContentType = "application/json";

                            var error = new
                            {
                                error = "Internal server error",
                                message = app.Environment.IsDevelopment()
                                    ? ex.Message
                                    : "An error occurred processing your request",
                                path = context.Request.Path.ToString(),
                                timestamp = DateTime.UtcNow,
                                traceId = context.TraceIdentifier,
                            };

                            await context.Response.WriteAsync(JsonSerializer.Serialize(error));
                        }
                    }
                }
            );

            return app;
        }

        /// <summary>
        /// Dodaje specjalne nagłówki dla środowiska Staging
        /// </summary>
        public static WebApplication UseStagingHeaders(this WebApplication app)
        {
            if (app.Environment.IsStaging())
            {
                app.Use(
                    async (context, next) =>
                    {
                        context.Response.Headers.Add("X-Environment", "Staging");
                        context.Response.Headers.Add("X-Robots-Tag", "noindex, nofollow");
                        context.Response.Headers.Add(
                            "X-Warning",
                            "This is staging environment - Do not use production data!"
                        );
                        await next();
                    }
                );
            }

            return app;
        }

        /// <summary>
        /// Dodaje middleware do walidacji custom tokenów
        /// </summary>
        public static WebApplication UseCustomTokenValidation(this WebApplication app)
        {
            app.Use(
                async (context, next) =>
                {
                    var token = context
                        .Request.Headers["Authorization"]
                        .FirstOrDefault()
                        ?.Split(" ")
                        .LastOrDefault();

                    if (
                        !string.IsNullOrEmpty(token)
                        && context.User?.Identity?.IsAuthenticated != true
                    )
                    {
                        try
                        {
                            var protector = context
                                .RequestServices.GetRequiredService<IDataProtectionProvider>()
                                .CreateProtector("VocareAuth");

                            var json = protector.Unprotect(token);
                            var tokenData = JsonSerializer.Deserialize<JsonElement>(json);

                            // Sprawdź expiration
                            if (tokenData.TryGetProperty("exp", out var expElement))
                            {
                                var exp = expElement.GetInt64();
                                if (
                                    DateTimeOffset.FromUnixTimeSeconds(exp) <= DateTimeOffset.UtcNow
                                )
                                {
                                    await next();
                                    return;
                                }
                            }

                            // Ustaw użytkownika
                            if (tokenData.TryGetProperty("sub", out var sub))
                            {
                                var userId = sub.GetString();
                                var userManager = context.RequestServices.GetRequiredService<
                                    UserManager<User>
                                >();
                                var user = await userManager.FindByIdAsync(userId);

                                if (user != null)
                                {
                                    var principal = await context
                                        .RequestServices.GetRequiredService<
                                            IUserClaimsPrincipalFactory<User>
                                        >()
                                        .CreateAsync(user);
                                    context.User = principal;
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            var logger = context.RequestServices.GetRequiredService<
                                ILogger<Program>
                            >();
                            logger.LogDebug(ex, "Failed to validate custom token");
                        }
                    }

                    await next();
                }
            );

            return app;
        }

        /// <summary>
        /// Dodaje middleware do logowania requestów (dla debugowania)
        /// </summary>
        public static WebApplication UseRequestLogging(this WebApplication app)
        {
            if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
            {
                app.Use(
                    async (context, next) =>
                    {
                        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();

                        logger.LogInformation(
                            "Request: {Method} {Path} from {IP}",
                            context.Request.Method,
                            context.Request.Path,
                            context.Connection.RemoteIpAddress
                        );

                        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
                        await next();
                        stopwatch.Stop();

                        logger.LogInformation(
                            "Response: {StatusCode} for {Path} in {ElapsedMs}ms",
                            context.Response.StatusCode,
                            context.Request.Path,
                            stopwatch.ElapsedMilliseconds
                        );
                    }
                );
            }

            return app;
        }
    }
}
