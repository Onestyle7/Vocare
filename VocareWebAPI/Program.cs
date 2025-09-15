using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;
using Stripe;
using VocareWebAPI.Extensions.ApplicationBuilderExtensions;
using VocareWebAPI.Extensions.ServiceCollectionExtensions;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Services;

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

// ===== MIDDLEWARE PIPELINE =====
app.UseRouting();
app.UseCors("AllowAll");

app.UseCustomCorsMiddleware();
app.UseStagingHeaders();
app.UseSecurityHeaders();
app.UseRateLimiter();
app.UseCookiePolicy();
app.UseAuthentication();
app.UseCustomTokenValidation();
app.UseAuthorization();

// ===== ENDPOINTS =====
app.MapControllers();
app.MapIdentityApi<User>();

// ===== MIGRACJA BAZY DANYCH - REFACTORED =====
await app.MigrateDatabaseAsync();

app.Run();

public partial class Program { }
