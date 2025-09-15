using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Models.Entities;

namespace VocareWebAPI.Extensions.ApplicationBuilderExtensions
{
    public static class MiddlewareExtensions
    {
        /// <summary>
        /// Dodaje custom CORS middleware z obsługą błędów
        /// </summary>
        public static WebApplication UseCustomCorsMiddleware(this WebApplication app)
        {
            app.Use(
                async (context, next) =>
                {
                    try
                    {
                        // Ustaw CORS dla WSZYSTKICH requestów
                        var origin = context.Request.Headers["Origin"].ToString();

                        // Na stagingu akceptuj wszystkie originy
                        if (!string.IsNullOrEmpty(origin))
                        {
                            context.Response.Headers["Access-Control-Allow-Origin"] = origin;
                            context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
                            context.Response.Headers["Access-Control-Allow-Methods"] =
                                "GET, POST, PUT, DELETE, OPTIONS, PATCH";
                            context.Response.Headers["Access-Control-Allow-Headers"] =
                                "Content-Type, Authorization, X-Requested-With";
                            context.Response.Headers["Access-Control-Max-Age"] = "86400"; // Cache preflight na 24h
                        }

                        // Handle preflight
                        if (context.Request.Method == "OPTIONS")
                        {
                            context.Response.StatusCode = 204;
                            return;
                        }

                        await next();
                    }
                    catch (Exception ex)
                    {
                        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
                        logger.LogError(
                            ex,
                            "Error in CORS middleware for {Method} {Path}",
                            context.Request.Method,
                            context.Request.Path
                        );

                        // CORS nawet przy błędzie
                        if (!context.Response.HasStarted)
                        {
                            var origin = context.Request.Headers["Origin"].ToString();
                            if (!string.IsNullOrEmpty(origin))
                            {
                                context.Response.Headers["Access-Control-Allow-Origin"] = origin;
                                context.Response.Headers["Access-Control-Allow-Credentials"] =
                                    "true";
                            }

                            context.Response.StatusCode = 500;
                            context.Response.ContentType = "application/json";

                            await context.Response.WriteAsync(
                                JsonSerializer.Serialize(
                                    new
                                    {
                                        error = "Internal server error",
                                        message = app.Environment.IsDevelopment()
                                            ? ex.Message
                                            : "An error occurred",
                                        path = context.Request.Path.ToString(),
                                    }
                                )
                            );
                        }
                    }
                }
            );

            return app; // ✅ WAŻNE: Zawsze zwracaj app!
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
                        context.Response.Headers.Add("X-Warning", "This is staging environment");
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
                            logger.LogWarning(ex, "Failed to validate custom token");
                        }
                    }

                    await next();
                }
            );

            return app;
        }
    }
}
