using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Npgsql;
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
            var connectionString = GetConnectionString(configuration);

            var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
            dataSourceBuilder.EnableDynamicJson();
            dataSourceBuilder.UseVector();
            var dataSource = dataSourceBuilder.Build();

            services.AddSingleton(dataSource);

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseNpgsql(dataSource, o => o.UseVector());
            });

            return services;
        }

        internal static string GetConnectionString(IConfiguration configuration)
        {
            var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

            if (!string.IsNullOrEmpty(databaseUrl))
            {
                var databaseUri = new Uri(databaseUrl);
                var userInfo = databaseUri.UserInfo.Split(':');

                return $"Host={databaseUri.Host};"
                    + $"Port={databaseUri.Port};"
                    + $"Database={databaseUri.LocalPath.TrimStart('/')};"
                    + $"Username={userInfo[0]};"
                    + $"Password={userInfo[1]};"
                    + $"SSL Mode=Prefer;Trust Server Certificate=true";
            }

            return configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("No database connection configured");
        }
    }
}
