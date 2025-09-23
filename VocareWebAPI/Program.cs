using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Stripe;
using VocareWebAPI.Data;
using VocareWebAPI.Extensions.ApplicationBuilderExtensions;
using VocareWebAPI.Extensions.ServiceCollectionExtensions;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// ===== RAILWAY PORT CONFIGURATION - KRYTYCZNE! =====
var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
Console.WriteLine($"Starting application on port: {port}");

// ===== LOGGING CONFIGURATION =====
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
if (builder.Environment.IsStaging() || builder.Environment.IsDevelopment())
{
    builder.Logging.SetMinimumLevel(LogLevel.Debug);
}

// ===== PODSTAWOWA KONFIGURACJA =====
builder.Services.AddEndpointsApiExplorer();
builder
    .Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// ===== CORS - PRAWIDŁOWA KONFIGURACJA =====
builder.Services.AddCorsConfiguration(builder.Configuration, builder.Environment);

// ===== RATE LIMITING =====
builder.Services.AddRateLimiting(builder.Environment);

// ===== KONFIGURACJA, BAZA, HTTP, DI - REFACTORED =====
builder
    .Services.AddConfiguration(builder.Configuration)
    .AddDatabase(builder.Configuration)
    .AddHttpClients(builder.Configuration)
    .AddApplicationServices()
    .AddRepositories()
    .AddAutoMapper(typeof(UserProfileService).Assembly);

// ===== AUTHENTICATION & AUTHORIZATION =====
builder.Services.AddAuthenticationConfiguration(builder.Configuration);

// ===== DATA PROTECTION CONFIGURATION =====
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromHours(24);
});

// ===== SWAGGER =====
builder.Services.AddSwaggerConfiguration();

// ===== STRIPE =====
if (!string.IsNullOrEmpty(builder.Configuration["Stripe:SecretKey"]))
{
    StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];
}
VocareWebAPI.Billing.Configuration.TokenPackagesConfiguration.Initialize(builder.Configuration);
VocareWebAPI.Billing.Configuration.SubscriptionPackagesConfiguration.Initialize(
    builder.Configuration
);
var app = builder.Build();

// ===== HEALTH CHECK - PIERWSZY ENDPOINT =====
app.MapGet(
        "/health",
        () =>
            Results.Ok(
                new
                {
                    status = "healthy",
                    environment = app.Environment.EnvironmentName,
                    timestamp = DateTime.UtcNow,
                    port = port,
                }
            )
    )
    .AllowAnonymous();

// ===== SWAGGER UI =====
app.UseSwaggerConfiguration(app.Environment);

// ===== MIDDLEWARE PIPELINE - PRAWIDŁOWA KOLEJNOŚĆ =====

// 1. Exception handling i request logging
if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
{
    app.UseRequestLogging(); // Logowanie requestów
    app.UseCorsLoggingMiddleware(); // Debugowanie CORS
}
else
{
    app.UseExceptionHandler("/error");
}

// Global exception handling dla wszystkich środowisk
app.UseGlobalExceptionHandling();

// 2. HTTPS Redirection (tylko produkcja)
if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

// 3. Security Headers - PRZED CORS
if (!app.Environment.IsDevelopment())
{
    app.UseSecurityHeaders();
}

// 4. Routing musi być przed CORS
app.UseRouting();

// 5. CORS - UŻYWAMY STANDARDOWEGO MIDDLEWARE!
var policyName = CorsExtensions.GetCorsPolicyName(app.Environment);
if (!string.IsNullOrEmpty(policyName))
{
    app.UseCors(policyName);
    app.Logger.LogInformation(
        $"Using CORS policy: {policyName} for environment: {app.Environment.EnvironmentName}"
    );
}
else
{
    app.UseCors(); // Użyj domyślnej polityki
    app.Logger.LogWarning("Using default CORS policy");
}

// 6. Rate limiting
app.UseRateLimiter();

// 7. Authentication & Authorization (w tej kolejności!)
app.UseAuthentication();
app.UseCustomTokenValidation(); // Twój custom token validation
app.UseAuthorization();

// 8. Opcjonalne middleware dla staging
if (app.Environment.IsStaging())
{
    app.UseStagingHeaders();
}

// ===== ENDPOINTS =====
app.MapControllers();
app.MapIdentityApi<User>();

// ===== OPCJONALNE ENDPOINT DO MANUALNEJ MIGRACJI =====
if (!app.Environment.IsProduction())
{
    app.MapPost(
            "/api/migrate",
            async (AppDbContext db, ILogger<Program> logger) =>
            {
                try
                {
                    logger.LogInformation("Starting manual migration...");
                    await db.Database.MigrateAsync();
                    return Results.Ok(new { message = "Migration completed successfully" });
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Migration failed");
                    return Results.Problem($"Migration failed: {ex.Message}");
                }
            }
        )
        .RequireAuthorization();
}

// ===== MIGRACJA BAZY DANYCH - Z TIMEOUT =====
using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

var retries = 0;
const int maxRetries = 10;

while (retries < maxRetries)
{
    try
    {
        logger.LogInformation($"Attempting database migration... ({retries + 1}/{maxRetries})");

        if (await db.Database.CanConnectAsync())
        {
            logger.LogInformation("Database connection successful");

            // Ta logika jest KRYTYCZNA dla Railway!
            var tableCount = await db.Database.ExecuteSqlRawAsync(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
            );

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
            catch { }

            await db.Database.MigrateAsync();
            logger.LogInformation("Database migration completed successfully.");
            break;
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

        var delay = 10000; // 10 sekund
        logger.LogWarning(
            $"DB migration attempt failed, retrying in {delay}ms... ({retries}/{maxRetries}). Error: {ex.Message}"
        );
        await Task.Delay(delay);
    }
}

app.Run();

public partial class Program { }
