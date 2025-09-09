using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;

namespace VocareWebAPI.Extensions.ServiceCollectionExtensions
{
    public static class DatabaseExtensions
    {
        /// <summary>
        /// Konfiguruje DbContext w DI Container
        /// </summary>
        public static IServiceCollection AddDatabase(
            this IServiceCollection services,
            IConfiguration configuration
        )
        {
            services.AddDbContext<AppDbContext>(options =>
            {
                var connectionString = GetConnectionString(configuration);

                options.UseNpgsql(connectionString);

                // Tylko jeśli masz problemy z połączeniem:
                // options.UseNpgsql(connectionString, npgsqlOptions =>
                // {
                //     npgsqlOptions.EnableRetryOnFailure(3);
                // });
            });

            return services;
        }

        private static string GetConnectionString(IConfiguration configuration)
        {
            // Railway używa DATABASE_URL
            var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

            if (!string.IsNullOrEmpty(databaseUrl))
            {
                // Konwertuj DATABASE_URL na connection string
                var databaseUri = new Uri(databaseUrl);
                var userInfo = databaseUri.UserInfo.Split(':');

                return $"Host={databaseUri.Host};"
                    + $"Port={databaseUri.Port};"
                    + $"Database={databaseUri.LocalPath.TrimStart('/')};"
                    + $"Username={userInfo[0]};"
                    + $"Password={userInfo[1]};"
                    + $"SSL Mode=Require;Trust Server Certificate=true";
            }

            // Fallback na appsettings.json
            return configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("No database connection configured");
        }
    }
}
