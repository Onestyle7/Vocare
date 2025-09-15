using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using VocareWebAPI.Models.Entities;

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
                    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();

                    // Ustaw CORS headers NATYCHMIAST (nie w OnStarting!)
                    var origin = context.Request.Headers["Origin"].ToString();
                    if (!string.IsNullOrEmpty(origin))
                    {
                        // Na staging/dev akceptuj wszystkie origins
                        if (app.Environment.IsStaging() || app.Environment.IsDevelopment())
                        {
                            context.Response.Headers["Access-Control-Allow-Origin"] = origin;
                        }
                        // Na produkcji tylko dozwolone domeny
                        else if (app.Environment.IsProduction())
                        {
                            var allowedOrigins = new[]
                            {
                                "https://vocare.pl",
                                "https://www.vocare.pl",
                                "https://app.vocare.pl",
                            };

                            if (allowedOrigins.Any(o => origin.StartsWith(o)))
                            {
                                context.Response.Headers["Access-Control-Allow-Origin"] = origin;
                            }
                        }

                        // Zawsze ustaw te headers jeśli origin jest ustawiony
                        if (context.Response.Headers.ContainsKey("Access-Control-Allow-Origin"))
                        {
                            context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
                            context.Response.Headers["Access-Control-Allow-Methods"] =
                                "GET, POST, PUT, DELETE, OPTIONS, PATCH";
                            context.Response.Headers["Access-Control-Allow-Headers"] =
                                "Content-Type, Authorization, X-Requested-With";
                            context.Response.Headers["Access-Control-Max-Age"] = "86400";
                        }
                    }

                    // Handle OPTIONS preflight request - WAŻNE: return natychmiast!
                    if (context.Request.Method == "OPTIONS")
                    {
                        logger.LogDebug(
                            "Handling OPTIONS preflight request for {Path}",
                            context.Request.Path
                        );
                        context.Response.StatusCode = 204;
                        return; // NIE WYWOŁUJ next()!
                    }

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

                        // Upewnij się że CORS headers są ustawione nawet przy błędzie
                        if (!context.Response.HasStarted && !string.IsNullOrEmpty(origin))
                        {
                            context.Response.Headers.TryAdd("Access-Control-Allow-Origin", origin);
                            context.Response.Headers.TryAdd(
                                "Access-Control-Allow-Credentials",
                                "true"
                            );
                        }

                        // Zwróć błąd JSON
                        if (!context.Response.HasStarted)
                        {
                            context.Response.StatusCode = 500;
                            context.Response.ContentType = "application/json";

                            var error = new
                            {
                                error = "Internal server error",
                                message = app.Environment.IsDevelopment()
                                    ? ex.Message
                                    : "An error occurred",
                                path = context.Request.Path.ToString(),
                                timestamp = DateTime.UtcNow,
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
                            logger.LogDebug(ex, "Failed to validate custom token");
                        }
                    }

                    await next();
                }
            );

            return app;
        }
    }
}
