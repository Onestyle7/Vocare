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

builder.Services.AddAuthenticationConfiguration(builder.Configuration);

// ===== DATA PROTECTION CONFIGURATION =====
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromHours(24);
});

// ===== SWAGGER =====
builder.Services.AddSwaggerConfiguration();

// ===== CORS =====
builder.Services.AddCorsConfiguration(builder.Environment);

// ===== STRIPE =====
if (!string.IsNullOrEmpty(builder.Configuration["Stripe:SecretKey"]))
{
    StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];
}

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
app.UseRouting();

// Użyj CORS z Extensions - NIE duplikuj!
app.UseCustomCorsMiddleware();

// Opcjonalne middleware dla staging
if (app.Environment.IsStaging())
{
    app.UseStagingHeaders();
}

// Security headers - może powodować problemy, więc opcjonalnie
if (!app.Environment.IsDevelopment())
{
    app.UseSecurityHeaders();
}

// Rate limiting
app.UseRateLimiter();

// Cookie i Auth
app.UseCookiePolicy();
app.UseAuthentication();
app.UseCustomTokenValidation();
app.UseAuthorization();

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
try
{
    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
    await app.MigrateDatabaseAsync();
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Database migration failed, but continuing...");
    // NIE PRZERYWAJ STARTU APLIKACJI!
}

app.Run();

public partial class Program { }
