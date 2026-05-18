using Hangfire.Annotations;
using Hangfire.Dashboard;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Shared.Hangfire
{
    public class HangfireDashboardAuthFilter : IDashboardAuthorizationFilter
    {
        private readonly List<string> _allowedUserIds = new List<string>();

        public HangfireDashboardAuthFilter(List<string> allowedUsers)
        {
            _allowedUserIds.AddRange(allowedUsers);
        }

        public bool Authorize([NotNull] DashboardContext context)
        {
            var httpContext = context.GetHttpContext();
            /* if (httpContext?.User == null)
                return false; */

            var env = httpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
            /*   var userId = httpContext
                  .User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                  ?.Value;
  
              if (string.IsNullOrEmpty(userId))
                  return false;
  
              if (_allowedUserIds.Contains(userId))
                  return true; */

            // Tymczasowo - nie korzystamy z cookie auth, więc nie mamy jak przekazać wygodnie tokenu dostępu - dashboard i tak służy tylko do debugowania
            if (env.IsDevelopment() || env.IsStaging())
                return true; // dev/staging = otwarty

            return false; // produkcja = zamknięty
        }
    }
}
