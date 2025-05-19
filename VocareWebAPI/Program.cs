using System.Text.Json.Serialization;
using System.Threading;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Npgsql;
using Polly;
using Polly.Extensions.Http;
using Stripe;
using VocareWebAPI.Billing.Repositories.Implementations;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Interfaces;
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
using LocalBillingService = VocareWebAPI.Billing.Services.Implementations.BillingService;
using LocalStripeService = VocareWebAPI.Billing.Services.Implementations.StripeService;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers();
builder.Services.AddScoped<UserProfileService>();
builder.Services.Configure<AiConfig>(builder.Configuration.GetSection("PerplexityAI"));
builder
    .Services.AddHttpClient<IAiService, PerplexityAiService>(client =>
    {
        var config = builder.Configuration.GetSection("PerplexityAI").Get<AiConfig>()!;
        client.BaseAddress = new Uri(config.BaseUrl);
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.ApiKey}");
        client.DefaultRequestHeaders.Add("Accept", "application/json");
    })
    .AddPolicyHandler(GetRetryPolicy());

builder
    .Services.AddHttpClient<IMarketAnalysisService, MarketAnalysisService>(client =>
    {
        var config = builder.Configuration.GetSection("PerplexityAI").Get<AiConfig>()!;
        client.BaseAddress = new Uri(config.BaseUrl);
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.ApiKey}");
        client.DefaultRequestHeaders.Add("Accept", "application/json");
    })
    .AddPolicyHandler(GetRetryPolicy());

builder.Services.AddScoped<IAiService, PerplexityAiService>();
builder.Services.AddScoped<IMarketAnalysisService, MarketAnalysisService>();
builder.Services.AddScoped<IBillingService, LocalBillingService>();
builder.Services.AddScoped<IStripeService, LocalStripeService>();
builder.Services.AddScoped<ICvGenerationService, CvGenerationService>();

// repozytoria
builder.Services.AddScoped<IUserBillingRepository, UserBillingRepository>();
builder.Services.AddScoped<ITokenTransactionRepository, TokenTransactionRepository>();
builder.Services.AddScoped<IServiceCostRepository, ServiceCostRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IAiRecommendationRepository, AiRecommendationRepository>();
builder.Services.AddScoped<ICareerStatisticsRepository, CareerStatisticsRepository>();
builder.Services.AddScoped<ISkillDemandRepository, SkillDemandRepository>();
builder.Services.AddScoped<IMarketTrendsRepository, MarketTrendsRepository>();
builder.Services.AddScoped<IGeneratedCvRepository, GeneratedCvrepository>();

builder
    .Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddAutoMapper(typeof(UserProfileService).Assembly);
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
                new string[] { }
            },
        }
    );
});

builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = IdentityConstants.BearerScheme;
        options.DefaultChallengeScheme = IdentityConstants.BearerScheme;
        options.DefaultScheme = IdentityConstants.BearerScheme;
    })
    .AddBearerToken(IdentityConstants.BearerScheme);

builder.Services.AddAuthorization();

builder.Services.AddIdentityCore<User>().AddEntityFrameworkStores<AppDbContext>().AddApiEndpoints();

// Konfiguracja połączenia z bazą danych z uwzględnieniem Railway
// Najpierw próbujemy użyć DATABASE_URL, jeśli dostępny
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(databaseUrl))
{
    // Parsowanie URL i utworzenie connection string
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    var connectionString = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port,
        Username = userInfo[0],
        Password = userInfo[1],
        Database = uri.AbsolutePath.TrimStart('/'),
        SslMode = Npgsql.SslMode.Require,
        TrustServerCertificate = true,
    }.ToString();

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString));
    
    Console.WriteLine("Konfiguracja bazy danych z DATABASE_URL");
}
else
{
    // Jeśli DATABASE_URL jest niedostępny, użyj konfiguracji z appsettings.json
    // Aktualizacja ConnectionString na podstawie danych z Railway
    var connString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (connString?.Contains("postgres.railway.internal") == true)
    {
        // Zaktualizuj connection string, aby użyć zewnętrznego adresu zamiast wewnętrznego
        connString = connString.Replace("postgres.railway.internal", "ballast.proxy.rlwy.net")
                               .Replace("Port=5432", "Port=44153");
        
        // Dla debugowania
        Console.WriteLine("Zaktualizowano connection string na zewnętrzny adres");
    }
    
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connString));
    
    Console.WriteLine("Konfiguracja bazy danych z DefaultConnection");
}

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
StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapIdentityApi<User>();

static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .OrResult(msg => msg.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
}

// Testowanie połączenia z bazą danych przed migracją
try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var canConnect = db.Database.CanConnect();
        Console.WriteLine($"Połączenie z bazą danych: {(canConnect ? "SUKCES" : "BŁĄD")}");
        
        // Wyświetl informacje o kontekście bazy danych
        Console.WriteLine($"Provider: {db.Database.ProviderName}");
        
        // Sprawdź migracje
        var appliedMigrations = db.Database.GetAppliedMigrations().ToList();
        Console.WriteLine($"Ilość zastosowanych migracji: {appliedMigrations.Count}");
        
        var pendingMigrations = db.Database.GetPendingMigrations().ToList();
        Console.WriteLine($"Ilość oczekujących migracji: {pendingMigrations.Count}");
        
        if (pendingMigrations.Any())
        {
            Console.WriteLine("Oczekujące migracje:");
            foreach (var migration in pendingMigrations)
            {
                Console.WriteLine($" - {migration}");
            }
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Błąd podczas testowania połączenia: {ex.Message}");
}

// Migracja bazy danych
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var retries = 0;
    const int maxRetries = 10;
    while (true)
    {
        try
        {
            Console.WriteLine("Próba migracji bazy danych...");
            db.Database.Migrate();
            Console.WriteLine("Migracja zakończona sukcesem!");
            break;
        }
        catch (Exception ex)
        {
            retries++;
            Console.WriteLine($"Błąd migracji: {ex.Message}");
            if (retries >= maxRetries)
            {
                Console.WriteLine("Przekroczono maksymalną liczbę prób migracji.");
                throw; // po 10 próbach wyrzuć dalej
            }
            Console.WriteLine($"DB unavailable, retrying in 5s... ({retries}/{maxRetries})");
            Thread.Sleep(5000);
        }
    }
}

app.Run();
//Test ci/cd