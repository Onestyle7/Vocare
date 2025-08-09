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
using Polly;
using Polly.Extensions.Http;
using Stripe;
using VocareWebAPI.Billing.Repositories.Implementations;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.CvGenerator.Repositories.Implementations;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Implementation;
using VocareWebAPI.CvGenerator.Services.Implementations;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Config;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.Repositories.Implementations;
using VocareWebAPI.Repositories.Interfaces;
using VocareWebAPI.Services;
using VocareWebAPI.Services.Implementations;
using VocareWebAPI.UserManagement;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Services;
using VocareWebAPI.UserManagement.Services.Implementations;
using VocareWebAPI.UserManagement.Services.Interfaces;
using LocalBillingService = VocareWebAPI.Billing.Services.Implementations.BillingService;
using LocalStripeService = VocareWebAPI.Billing.Services.Implementations.StripeService;

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
            limiterOptions.PermitLimit = 5;
            limiterOptions.Window = TimeSpan.FromMinutes(5);
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
            context.User?.Identity?.Name ?? context.Request.Headers.Host.ToString(),
            factory => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
            }
        )
    );

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429; // Too Many Requests
        await context.HttpContext.Response.WriteAsync(
            "Too many requests, please try again later.",
            token
        );
    };
});

// ===== KONFIGURACJA (Options Pattern) =====
builder.Services.Configure<AiConfig>(builder.Configuration.GetSection("PerplexityAI"));
builder.Services.Configure<UserRegistrationConfig>(
    builder.Configuration.GetSection("UserRegistration")
);
builder.Services.Configure<AiConfig>(builder.Configuration.GetSection("OpenAI"));

// ===== BAZA DANYCH =====
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    // Na Railway użyj DATABASE_URL
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrEmpty(databaseUrl))
    {
        // Konwertuj DATABASE_URL z formatu Postgres na connection string
        var databaseUri = new Uri(databaseUrl);
        var userInfo = databaseUri.UserInfo.Split(':');

        connectionString =
            $"Host={databaseUri.Host};"
            + $"Port={databaseUri.Port};"
            + $"Database={databaseUri.LocalPath.TrimStart('/')};"
            + $"Username={userInfo[0]};"
            + $"Password={userInfo[1]};"
            + $"SSL Mode=Require;Trust Server Certificate=true";

        Console.WriteLine(
            $"Using DATABASE_URL from Railway: Host={databaseUri.Host}, Database={databaseUri.LocalPath.TrimStart('/')}"
        );
    }
    else
    {
        Console.WriteLine("No DATABASE_URL found, using connection string from appsettings");
    }

    options.UseNpgsql(connectionString);
});

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

// ===== HTTP CLIENTS =====
var retryPolicy = HttpPolicyExtensions
    .HandleTransientHttpError()
    .OrResult(msg => msg.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
    .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));

builder
    .Services.AddHttpClient<IAiService, PerplexityAiService>(client =>
    {
        var config = builder.Configuration.GetSection("PerplexityAI").Get<AiConfig>()!;
        client.BaseAddress = new Uri(config.BaseUrl);
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.ApiKey}");
        client.DefaultRequestHeaders.Add("Accept", "application/json");
    })
    .AddPolicyHandler(retryPolicy);

builder
    .Services.AddHttpClient<IMarketAnalysisService, MarketAnalysisService>(client =>
    {
        var config = builder.Configuration.GetSection("PerplexityAI").Get<AiConfig>()!;
        client.BaseAddress = new Uri(config.BaseUrl);
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.ApiKey}");
        client.DefaultRequestHeaders.Add("Accept", "application/json");
    })
    .AddPolicyHandler(retryPolicy);

builder
    .Services.AddHttpClient<IAiService, OpenAIService>(client =>
    {
        var config = builder.Configuration.GetSection("OpenAI").Get<AiConfig>()!;
        client.BaseAddress = new Uri(config.BaseUrl);
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.ApiKey}");
        client.DefaultRequestHeaders.Add("Accept", "application/json");
    })
    .AddPolicyHandler(retryPolicy);

// ===== SERWISY APLIKACJI =====
builder.Services.AddScoped<UserProfileService>();
builder.Services.AddScoped<UserRegistrationHandler>();
builder.Services.AddScoped<IAiService, OpenAIService>();
builder.Services.AddScoped<ICvManagementService, CvManagementService>();
builder.Services.AddScoped<IEmailService, EmailService>();

/* builder.Services.AddScoped<IAiService, PerplexityAiService>();
 */
builder.Services.AddScoped<IMarketAnalysisService, OpenAiMarketAnalysisService>();
builder.Services.AddScoped<IBillingService, LocalBillingService>();
builder.Services.AddScoped<IStripeService, LocalStripeService>();
builder.Services.AddScoped<ICvGenerationService, CvGenerationService>();
builder.Services.AddScoped<IUserSetupService, UserSetupService>();

// ===== REPOZYTORIA =====
builder.Services.AddScoped<IUserBillingRepository, UserBillingRepository>();
builder.Services.AddScoped<ITokenTransactionRepository, TokenTransactionRepository>();
builder.Services.AddScoped<IServiceCostRepository, ServiceCostRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IAiRecommendationRepository, AiRecommendationRepository>();
builder.Services.AddScoped<ICareerStatisticsRepository, CareerStatisticsRepository>();
builder.Services.AddScoped<ISkillDemandRepository, SkillDemandRepository>();
builder.Services.AddScoped<IMarketTrendsRepository, MarketTrendsRepository>();
builder.Services.AddScoped<IGeneratedCvRepository, GeneratedCvrepository>();

// ===== AUTOMAPPER =====
builder.Services.AddAutoMapper(typeof(UserProfileService).Assembly);

// ===== SWAGGER =====
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "VocareWebAPI",
            Version = "v1",
            Description = "Web Api for vocare application",
        }
    );

    c.CustomSchemaIds(type => type.FullName);

    c.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            In = ParameterLocation.Header,
            Description = "Wpisz token JWT",
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
        }
    );

    c.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer",
                    },
                },
                Array.Empty<string>()
            },
        }
    );
});

// ===== CORS =====
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowAll",
        policy =>
        {
            if (builder.Environment.IsDevelopment())
            {
                // W developmencie zezwalamy na wszystkie domeny
                policy
                    .SetIsOriginAllowed(origin =>
                    {
                        if (string.IsNullOrEmpty(origin))
                            return false;

                        var uri = new Uri(origin);

                        // Zezwól na wszystkie localhost porty
                        if (uri.Host == "localhost" || uri.Host == "127.0.0.1")
                            return true;

                        // Zezwól na produkcyjne domeny
                        var allowedHosts = new[]
                        {
                            "vocare.pl",
                            "app.vocare.pl",
                            "vocare-frontend.vercel.app",
                        };
                        return allowedHosts.Contains(uri.Host);
                    })
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            }
            else
            {
                // W produkcji/staging tylko konkretne domeny
                policy
                    .WithOrigins(
                        "https://vocare.pl",
                        "https://app.vocare.pl",
                        "https://vocare-frontend.vercel.app"
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            }
        }
    );
});

// ===== STRIPE =====
StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];

var app = builder.Build();

// ===== SWAGGER UI =====
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "VocareWebAPI Development v1");
        c.RoutePrefix = "swagger"; // Swagger dostępny na /swagger
        c.DocumentTitle = "Vocare API - Development";
    });
}

if (app.Environment.IsStaging())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "VocareWebAPI Staging v1");
        c.RoutePrefix = "swagger"; // Swagger dostępny na /swagger
        c.DocumentTitle = "Vocare API - STAGING ENVIRONMENT";

        c.HeadContent += "<style>.topbar { background-color: #ff9800 !important; }</style>";
    });

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
app.UseCors("AllowAll");

app.Use(
    async (context, next) =>
    {
        if (
            context.Request.Method == "OPTIONS"
            && context.Request.Path.StartsWithSegments("/api/auth/google-verify")
        )
        {
            var origin = context.Request.Headers["Origin"].ToString();
            if (!string.IsNullOrEmpty(origin))
            {
                // Użyj TryAdd zamiast Add, żeby uniknąć duplikatów
                context.Response.Headers.TryAdd("Access-Control-Allow-Origin", origin);
                context.Response.Headers.TryAdd("Access-Control-Allow-Credentials", "true");
                context.Response.Headers.TryAdd("Access-Control-Allow-Methods", "POST, OPTIONS");
                context.Response.Headers.TryAdd(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization"
                );
            }
            context.Response.StatusCode = 204;
            return;
        }

        // Dla innych requestów Google verify
        if (context.Request.Path.StartsWithSegments("/api/auth/google-verify"))
        {
            context.Response.OnStarting(() =>
            {
                if (!context.Response.HasStarted)
                {
                    var origin = context.Request.Headers["Origin"].ToString();
                    if (
                        !string.IsNullOrEmpty(origin)
                        && !context.Response.Headers.ContainsKey("Access-Control-Allow-Origin")
                    )
                    {
                        context.Response.Headers.TryAdd("Access-Control-Allow-Origin", origin);
                        context.Response.Headers.TryAdd("Access-Control-Allow-Credentials", "true");
                    }
                }
                return Task.CompletedTask;
            });
        }

        await next();
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

// ===== MIGRACJA BAZY DANYCH =====
using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

var retries = 0;
const int maxRetries = 10; // Więcej retry dla staging

while (retries < maxRetries)
{
    try
    {
        logger.LogInformation(
            "Attempting database migration... ({Attempt}/{MaxRetries})",
            retries + 1,
            maxRetries
        );

        // Sprawdź czy baza danych istnieje i czy można się połączyć
        if (await db.Database.CanConnectAsync())
        {
            logger.LogInformation("Database connection successful");

            // Sprawdź czy istnieją jakiekolwiek tabele
            var tableCount = await db.Database.ExecuteSqlRawAsync(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
            );

            logger.LogInformation("Number of existing tables: {TableCount}", tableCount);

            // Jeśli nie ma tabel, ale istnieje historia migracji, wyczyść ją
            try
            {
                var migrationHistory = await db.Database.GetAppliedMigrationsAsync();
                if (migrationHistory.Any() && tableCount == 0)
                {
                    logger.LogWarning(
                        "Migration history exists but no tables found. Clearing migration history."
                    );
                    await db.Database.ExecuteSqlRawAsync("DELETE FROM \"__EFMigrationsHistory\"");
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(
                    ex,
                    "Could not check or clear migration history (this is normal for first deployment)"
                );
            }

            // Wykonaj migracje
            logger.LogInformation("Executing database migrations...");
            await db.Database.MigrateAsync();

            // Sprawdź czy ServiceCosts mają dane
            try
            {
                var serviceCostCount = await db.ServiceCosts.CountAsync();
                if (serviceCostCount == 0)
                {
                    logger.LogInformation("Seeding ServiceCosts data...");
                    // EF Core powinno to zrobić automatycznie przez HasData, ale na wszelki wypadek
                    await db.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not check ServiceCosts (table might not exist yet)");
            }

            logger.LogInformation("Database migration completed successfully.");
            break;
        }
        else
        {
            throw new Exception("Cannot connect to database");
        }
    }
    catch (Exception ex)
    {
        retries++;
        if (retries >= maxRetries)
        {
            logger.LogError(
                ex,
                "Database migration failed after {MaxRetries} attempts.",
                maxRetries
            );
            throw;
        }

        var delay = app.Environment.IsStaging() ? 10000 : 5000; // Dłuższy delay dla staging
        logger.LogWarning(
            "DB migration attempt failed, retrying in {Delay}ms... ({Attempt}/{MaxRetries}). Error: {Error}",
            delay,
            retries,
            maxRetries,
            ex.Message
        );
        await Task.Delay(delay);
    }
}

app.Run();

public partial class Program { }
