using System.Text.Json.Serialization;
using System.Threading;
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

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers();
builder.Services.AddScoped<UserProfileService>();
builder.Services.Configure<AiConfig>(builder.Configuration.GetSection("PerplexityAI"));
builder.Services.Configure<UserRegistrationConfig>(
    builder.Configuration.GetSection("UserRegistration")
);
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

builder.Services.AddScoped<UserRegistrationHandler>();

builder.Services.AddScoped<IAiService, PerplexityAiService>();
builder.Services.AddScoped<IMarketAnalysisService, MarketAnalysisService>();
builder.Services.AddScoped<IBillingService, LocalBillingService>();
builder.Services.AddScoped<IStripeService, LocalStripeService>();
builder.Services.AddScoped<ICvGenerationService, CvGenerationService>();
builder.Services.AddScoped<IUserSetupService, UserSetupService>();

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

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});
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
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "VocareWebAPI v1");
        c.RoutePrefix = string.Empty; // Swagger będzie dostępny na głównej stronie
    });
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
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
            await db.Database.MigrateAsync();
            logger.LogInformation("Database migration completed successfully.");
            break;
        }
        catch (Exception ex)
        {
            retries++;
            if (retries >= maxRetries)
            {
                logger.LogError(
                    ex,
                    "Database migration failed after {MaxRetries} attempts. Application will start without migrations.",
                    maxRetries
                );
                break; // Pozwól aplikacji startować nawet bez bazy
            }

            logger.LogWarning(
                "DB unavailable, retrying in 5s... ({Attempt}/{MaxRetries}). Error: {Error}",
                retries,
                maxRetries,
                ex.Message
            );
            await Task.Delay(5000);
        }
    }
}
else
{
    // W produkcji nie rób auto-migrate - używaj CI/CD pipeline
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("Production environment - skipping automatic migrations.");
}

/* app.UseHttpsRedirection(); */
app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapIdentityApi<User>();
app.MapPost(
        "/register",
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

static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .OrResult(msg => msg.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
}

app.Run();
//Test ci/cd
