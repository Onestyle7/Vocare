using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();
app.MapIdentityApi<User>();
app.MapGet(
        "/users/me",
        async (ClaimsPrincipal claims, AppDbContext context) =>
        {
            try
            {
                if (!claims.Identity.IsAuthenticated)
                    return Results.Unauthorized();

                string userId = claims
                    .Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)
                    ?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Results.Problem("Brak identyfikatora użytkownika w tokenie.");

                var user = await context.Users.FindAsync(userId);
                if (user == null)
                    return Results.NotFound("Użytkownik nie znaleziony");

                return Results.Ok(user);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Błąd: {ex.Message}");
            }
        }
    )
    .RequireAuthorization(); // Wrzucić to potem w controller -> wszystkie dane zalogowanego użytkownika
app.MapGet(
    "/debug-claims",
    (ClaimsPrincipal user) =>
    {
        var claims = user.Claims.Select(c => new { c.Type, c.Value }).ToList();
        return Results.Ok(
            new { isAuthenticated = user.Identity?.IsAuthenticated ?? false, claims = claims }
        );
    }
);
app.MapGet("/test", () => "Test endpoint works!");
app.Run();
