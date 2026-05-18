using Hangfire;
using Hangfire.PostgreSql;

namespace VocareWebAPI.Extensions.ServiceCollectionExtensions
{
    public static class HangfireExtensions
    {
        public static IServiceCollection AddHangfireExtension(
            this IServiceCollection services,
            IConfiguration configuration
        )
        {
            services.AddHangfire(options =>
            {
                var connectionString = DatabaseExtensions.GetConnectionString(configuration);
                options.UsePostgreSqlStorage(connectionString);

                GlobalJobFilters.Filters.Add(new AutomaticRetryAttribute { Attempts = 1 });
            });
            services.AddHangfireServer();

            return services;
        }
    }
}
