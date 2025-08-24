using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Stripe;
using VocareWebAPI.Data;
using VocareWebAPI.Extensions.ApplicationBuilderExtensions;
using VocareWebAPI.Extensions.ServiceCollectionExtensions;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Services;
using VocareWebAPI.Services.Implementations;
using VocareWebAPI.UserManagement.Models.Entities;

var builder = WebApplication.CreateBuilder(args);

// ===== PODSTAWOWA KONFIGURACJA =====
builder.Services.AddEndpointsApiExplorer();
builder
    .Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// ===== RATE LIMITING =====
builder.Services.AddRateLimiting(builder.Environment);

// ===== KONFIGURACJA, BAZA, HTTP, DI - REFACTORED =====
builder
    .Services.AddConfiguration(builder.Configuration) // Options Pattern
    .AddDatabase(builder.Configuration) // Baza danych
    .AddHttpClients(builder.Configuration) // HTTP Clients
    .AddApplicationServices() // Serwisy
    .AddRepositories() // Repozytoria
    .AddAutoMapper(typeof(UserProfileService).Assembly); // AutoMapper

builder.Services.AddAuthenticationConfiguration(builder.Configuration);

// ===== DATA PROTECTION CONFIGURATION =====
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromHours(24); // Token ważny przez 24h
});

// ===== SWAGGER =====
builder.Services.AddSwaggerConfiguration();

// ===== CORS =====
builder.Services.AddCorsConfiguration(builder.Environment);

// ===== STRIPE =====
StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];

var app = builder.Build();

// ===== SWAGGER UI =====
app.UseSwaggerConfiguration(app.Environment);

// ===== STAGING SPECIFIC HEADERS =====
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

// ===== MIDDLEWARE PIPELINE =====

app.UseRouting();

/* app.UseCors("AllowAll");
 */
app.Use(
    async (context, next) =>
    {
        try
        {
            // Ustaw CORS dla WSZYSTKICH requestów od razu
            var origin = context.Request.Headers["Origin"].ToString();
            if (!string.IsNullOrEmpty(origin))
            {
                context.Response.Headers.Add("Access-Control-Allow-Origin", origin);
                context.Response.Headers.Add("Access-Control-Allow-Credentials", "true");
                context.Response.Headers.Add(
                    "Access-Control-Allow-Methods",
                    "GET, POST, PUT, DELETE, OPTIONS"
                );
                context.Response.Headers.Add(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization"
                );
            }

            if (context.Request.Method == "OPTIONS")
            {
                context.Response.StatusCode = 204;
                return;
            }

            await next();
        }
        catch (Exception ex)
        {
            // Loguj błąd
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(
                ex,
                "Unhandled exception for {Method} {Path}",
                context.Request.Method,
                context.Request.Path
            );

            // WAŻNE: Ustaw CORS nawet przy błędzie!
            var origin = context.Request.Headers["Origin"].ToString();
            if (!string.IsNullOrEmpty(origin) && !context.Response.HasStarted)
            {
                context.Response.Headers.TryAdd("Access-Control-Allow-Origin", origin);
                context.Response.Headers.TryAdd("Access-Control-Allow-Credentials", "true");
            }

            // Zwróć błąd
            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";

                var error = new
                {
                    error = "Internal server error",
                    message = ex.Message,
                    path = context.Request.Path.ToString(),
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(error));
            }
        }
    }
);

app.Use(
    async (context, next) =>
    {
        if (!context.Response.HasStarted)
        {
            context.Response.Headers.TryAdd("X-Content-Type-Options", "nosniff");
            context.Response.Headers.TryAdd("X-Frame-Options", "SAMEORIGIN");
            context.Response.Headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");

            // CSP różne dla środowisk
            if (app.Environment.IsDevelopment())
            {
                // Luźniejsze dla developmentu - React/Angular potrzebują 'unsafe-eval'
                context.Response.Headers.TryAdd(
                    "Content-Security-Policy",
                    "default-src 'self'; "
                        + "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; "
                        + "style-src 'self' 'unsafe-inline'; "
                        + "img-src 'self' data: https: blob:; "
                        + "connect-src 'self' https://api.stripe.com ws://localhost:* http://localhost:*;"
                );
            }
            else
            {
                // Restrykcyjne dla staging/produkcji
                context.Response.Headers.TryAdd(
                    "Content-Security-Policy",
                    "default-src 'self'; "
                        + "script-src 'self' https://js.stripe.com; "
                        + "style-src 'self' 'unsafe-inline'; "
                        + "img-src 'self' data: https:; "
                        + "font-src 'self' data:; "
                        + "connect-src 'self' https://api.stripe.com https://*.vocare.pl;"
                );
            }

            if (app.Environment.IsProduction())
            {
                context.Response.Headers.TryAdd(
                    "Strict-Transport-Security",
                    "max-age=31536000; includeSubDomains"
                );
            }
        }
        await next();
    }
);

app.UseRateLimiter();
app.UseCookiePolicy();
app.UseAuthentication();

app.Use(
    async (context, next) =>
    {
        var token = context
            .Request.Headers["Authorization"]
            .FirstOrDefault()
            ?.Split(" ")
            .LastOrDefault();

        if (!string.IsNullOrEmpty(token) && context.User?.Identity?.IsAuthenticated != true)
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
                    if (DateTimeOffset.FromUnixTimeSeconds(exp) <= DateTimeOffset.UtcNow)
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
                            .RequestServices.GetRequiredService<IUserClaimsPrincipalFactory<User>>()
                            .CreateAsync(user);
                        context.User = principal;
                    }
                }
            }
            catch (Exception ex)
            {
                var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogWarning(ex, "Failed to validate custom token");
            }
        }

        await next();
    }
);

app.UseAuthorization();

// ===== ENDPOINTS =====
app.MapControllers();
app.MapIdentityApi<User>();

// ===== DEBUG ENDPOINT (opcjonalnie - dla staging/development) =====
if (!app.Environment.IsProduction())
{
    app.MapGet(
            "/debug/environment",
            (IWebHostEnvironment env) =>
                new
                {
                    Environment = env.EnvironmentName,
                    IsProduction = env.IsProduction(),
                    IsStaging = env.IsStaging(),
                    IsDevelopment = env.IsDevelopment(),
                    MachineName = Environment.MachineName,
                    Variables = new
                    {
                        DOTNET_ENVIRONMENT = Environment.GetEnvironmentVariable(
                            "DOTNET_ENVIRONMENT"
                        ),
                        ASPNETCORE_ENVIRONMENT = Environment.GetEnvironmentVariable(
                            "ASPNETCORE_ENVIRONMENT"
                        ),
                        DATABASE_URL_SET = !string.IsNullOrEmpty(
                            Environment.GetEnvironmentVariable("DATABASE_URL")
                        ),
                    },
                }
        )
        .AllowAnonymous();
}

// ===== MIGRACJA BAZY DANYCH - REFACTORED =====
await app.MigrateDatabaseAsync();

app.Run();

public partial class Program { }
