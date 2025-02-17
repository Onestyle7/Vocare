using VocareAPI.Core.Interfaces.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using VocareAPI.Application.Mapping;
using VocareAPI.Application.Services.Interfaces;
using VocareAPI.Application.Services;
using Microsoft.AspNetCore.Identity;
using VocareAPI.Core.Entities;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer(); 
builder.Services.AddSwaggerGen(c => 
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "VocareAPI", Version = "v1" });
});
builder.Services.AddOpenApi();
builder.Services.AddDbContext<VocareDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddAutoMapper(typeof(UsermappingProfile));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<PasswordHasher<User>>();


// Rejestracja JwtSettings
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtSettings = jwtSection.Get<VocareAPI.Core.JwtSettings>(); // Upewnij się, że namespace się zgadza
builder.Services.AddSingleton(jwtSettings);

// Konfiguracja JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is missing"))
            )
        };
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => 
    {
       // endpoint swagger JSON
       c.SwaggerEndpoint("/swagger/v1/swagger.json", "Vocare API v1");
       // możesz też dodać c.RoutePrefix = string.Empty, jeśli chcesz żeby Swagger był na stronie głównej
    });
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
