using Hangfire;
using VocareWebAPI.Shared.Hangfire;

namespace VocareWebAPI.Extensions.ApplicationBuilderExtensions
{
    public static class HangfireExtensions
    {
        public static IApplicationBuilder UseHangfireDashboardWithAuth(
            this IApplicationBuilder app,
            IConfiguration configuration
        )
        {
            var userList =
                configuration.GetSection("Hangfire:AllowedDashboardUserIds").Get<List<string>>()
                ?? new List<string>();
            app.UseHangfireDashboard(
                "/hangfire",
                new DashboardOptions { Authorization = [new HangfireDashboardAuthFilter(userList)] }
            );

            return app;
        }
    }
}
