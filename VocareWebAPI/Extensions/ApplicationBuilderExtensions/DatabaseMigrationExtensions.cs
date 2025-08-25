using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Npgsql.Replication;
using VocareWebAPI.Data;

namespace VocareWebAPI.Extensions.ApplicationBuilderExtensions
{
    public static class DatabaseExtensions
    {
        /// <summary>
        /// Wykonuje migrację bazy danych z retry logic
        /// </summary>
        public static async Task<WebApplication> MigrateDatabaseAsync(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

            var retries = 0;
            const int maxRetries = 10;
            var delay = app.Environment.IsStaging() ? 10000 : 5000;

            while (retries < maxRetries)
            {
                try
                {
                    logger.LogInformation(
                        "Attempting database migration... ({Attempt}/{MaxRetries})",
                        retries + 1,
                        maxRetries
                    );

                    if (await db.Database.CanConnectAsync())
                    {
                        logger.LogInformation("Database connection successful");

                        // Wykonaj migracje
                        await db.Database.MigrateAsync();

                        logger.LogInformation("Database migration completed successfully");
                        break;
                    }
                    else
                    {
                        throw new Exception("Cannot connect to database");
                    }
                }
                catch (Exception ex)
                {
                    retries++;

                    if (retries >= maxRetries)
                    {
                        logger.LogError(
                            ex,
                            "Database migration failed after {MaxRetries} attempts",
                            maxRetries
                        );
                        throw;
                    }

                    logger.LogWarning(
                        "DB migration attempt failed, retrying in {Delay}ms... ({Attempt}/{MaxRetries}). Error: {Error}",
                        delay,
                        retries,
                        maxRetries,
                        ex.Message
                    );

                    await Task.Delay(delay);
                }
            }

            return app;
        }
    }
}
