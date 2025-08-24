using Microsoft.AspNetCore.Identity;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Extensions.ServiceCollectionExtensions
{
    public static class AuthenticationExtensions
    {
        public static IServiceCollection AddAuthenticationConfiguration(
            this IServiceCollection services,
            IConfiguration configuration
        )
        {
            services
                .AddIdentity<User, IdentityRole>(options =>
                {
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
                .AddDefaultTokenProviders()
                .AddApiEndpoints();
            services
                .AddAuthentication(options =>
                {
                    // Dla bearer tokens (indetity api)
                    options.DefaultAuthenticateScheme = IdentityConstants.BearerScheme;
                    options.DefaultChallengeScheme = IdentityConstants.BearerScheme;
                    options.DefaultScheme = IdentityConstants.BearerScheme;
                })
                .AddBearerToken(IdentityConstants.BearerScheme)
                .AddGoogle(options =>
                {
                    options.ClientId = configuration["Authentication:Google:ClientId"]!;
                    options.ClientSecret = configuration["Authentication:Google:ClientSecret"]!;
                    options.SaveTokens = true;
                    options.Events.OnRedirectToAuthorizationEndpoint = context =>
                    {
                        Console.WriteLine($"=== GOOGLE REDIRECT ===");
                        Console.WriteLine($"Redirect URI: {context.RedirectUri}");
                        Console.WriteLine($"======================");

                        context.Response.Redirect(context.RedirectUri);
                        return Task.CompletedTask;
                    };
                    options.Scope.Add("openid");
                    options.Scope.Add("profile");
                    options.Scope.Add("email");
                });

            services.ConfigureApplicationCookie(options =>
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

            services.Configure<DataProtectionTokenProviderOptions>(options =>
            {
                options.TokenLifespan = TimeSpan.FromHours(24); // token ważny przez 24h
            });

            services.AddAuthorization();
            return services;
        }
    }
}
