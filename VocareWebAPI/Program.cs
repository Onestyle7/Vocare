using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
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
using LocalBillingService = VocareWebAPI.Billing.Services.Implementations.BillingService;
using LocalStripeService = VocareWebAPI.Billing.Services.Implementations.StripeService;

var builder = WebApplication.CreateBuilder(args);

// ===== PODSTAWOWA KONFIGURACJA =====
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder
    .Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
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
    .Services.AddIdentityCore<User>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddApiEndpoints();

builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = IdentityConstants.BearerScheme;
        options.DefaultChallengeScheme = IdentityConstants.BearerScheme;
        options.DefaultScheme = IdentityConstants.BearerScheme;
    })
    .AddBearerToken(IdentityConstants.BearerScheme);

builder.Services.AddAuthorization();

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

/* builder.Services.AddScoped<IAiService, PerplexityAiService>();
 */builder.Services.AddScoped<IMarketAnalysisService, OpenAiMarketAnalysisService>();
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
            policy
                .SetIsOriginAllowed(origin => true) // zezwól na wszystkie originy (do testów)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "VocareWebAPI v1");
        c.RoutePrefix = string.Empty; // Swagger będzie dostępny na głównej stronie
    });
}

// ===== MIDDLEWARE PIPELINE =====
// app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// ===== ENDPOINTS =====
app.MapControllers();
app.MapIdentityApi<User>();

// Custom registration endpoint z logiką dodawania tokenów
app.MapPost(
        "/api/register",
        async (
            [FromBody] RegisterRequest request,
            UserManager<User> userManager,
            UserRegistrationHandler registrationHandler
        ) =>
        {
            // Standardowa rejestracja Identity
            var user = new User { UserName = request.Email, Email = request.Email };
            var result = await userManager.CreateAsync(user, request.Password);

            if (result.Succeeded)
            {
                // Setup billing po udanej rejestracji
                await registrationHandler.HandleUserRegistrationAsync(user.Id);

                return Results.Ok(new { message = "User registered successfully" });
            }

            return Results.BadRequest(result.Errors);
        }
    )
    .AllowAnonymous();

// ===== MIGRACJA BAZY DANYCH =====
using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

var retries = 0;
const int maxRetries = 10;

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

        logger.LogWarning(
            "DB migration attempt failed, retrying in 5s... ({Attempt}/{MaxRetries}). Error: {Error}",
            retries,
            maxRetries,
            ex.Message
        );
        await Task.Delay(5000);
    }
}
app.Run();
