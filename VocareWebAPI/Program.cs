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
builder.Services.AddRateLimiter(options =>
{
    // Polityka dla AI - 3 requestów na minutę
    options.AddFixedWindowLimiter(
        "AiPolicy",
        limiterOptions =>
        {
            limiterOptions.PermitLimit = 3;
            limiterOptions.Window = TimeSpan.FromMinutes(1);
            limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            limiterOptions.QueueLimit = 2;
        }
    );

    // Polityka dla logowania - 5 prób na 5 minut
    options.AddFixedWindowLimiter(
        "LoginPolicy",
        limiterOptions =>
        {
            limiterOptions.PermitLimit = builder.Environment.IsDevelopment() ? 50 : 20;
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
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.User?.Identity?.IsAuthenticated == true
                ? $"user_{context.User.Identity.Name}"
                : $"ip_{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}",
            factory => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = builder.Environment.IsDevelopment() ? 300 : 150,
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
            message = "Too many requests, please try again later.",
            retryAfterSeconds = 60,
        };

        await context.HttpContext.Response.WriteAsJsonAsync(response, cancellationToken: token);
    };
});

// ===== KONFIGURACJA, BAZA, HTTP, DI - REFACTORED =====
builder
    .Services.AddConfiguration(builder.Configuration) // Options Pattern
    .AddDatabase(builder.Configuration) // Baza danych
    .AddHttpClients(builder.Configuration) // HTTP Clients
    .AddApplicationServices() // Serwisy
    .AddRepositories() // Repozytoria
    .AddAutoMapper(typeof(UserProfileService).Assembly); // AutoMapper

// ===== IDENTITY & AUTORYZACJA =====
builder
    .Services.AddIdentity<User, IdentityRole>(options =>
    {
        // Konfiguracja wymagań hasła
        options.Password.RequireDigit = true;
        options.Password.RequiredLength = 6;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        options.Password.RequiredUniqueChars = 1;

        // Konfiguracja użytkownika
        options.User.RequireUniqueEmail = true;
        options.SignIn.RequireConfirmedEmail = false;

        // Konfiguracja lockout
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.AllowedForNewUsers = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders() // Potrzebne do reset hasła
    .AddApiEndpoints();

// ===== COOKIE POLICY CONFIGURATION =====
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.CheckConsentNeeded = context => false;
    options.MinimumSameSitePolicy = SameSiteMode.None;
    options.Secure = CookieSecurePolicy.SameAsRequest;
});

// ===== AUTHENTICATION CONFIGURATION =====
builder
    .Services.AddAuthentication(options =>
    {
        // Dla Bearer tokens (Identity API)
        options.DefaultAuthenticateScheme = IdentityConstants.BearerScheme;
        options.DefaultChallengeScheme = IdentityConstants.BearerScheme;
        options.DefaultScheme = IdentityConstants.BearerScheme;
    })
    .AddBearerToken(IdentityConstants.BearerScheme)
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
        options.SaveTokens = true;
        options.Events.OnRedirectToAuthorizationEndpoint = context =>
        {
            Console.WriteLine($"=== GOOGLE REDIRECT ===");
            Console.WriteLine($"Redirect URI: {context.RedirectUri}");
            Console.WriteLine($"======================");

            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };

        //scope'y potrzebne do uzyskania danych użytkownika
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("email");
    });

// ===== APPLICATION COOKIE CONFIGURATION =====
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/api/auth/login";
    options.LogoutPath = "/api/auth/logout";
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

builder.Services.AddAuthorization();

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
