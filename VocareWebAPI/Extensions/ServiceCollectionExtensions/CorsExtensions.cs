using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Extensions.ServiceCollectionExtensions
{
    public static class CorsExtensions
    {
        /// <summary>
        /// Konfiguruje CORS dla aplikacji
        /// </summary>
        /// <param name="services"></param>
        /// <param name="env"></param>
        /// <returns></returns>
        public static IServiceCollection AddCorsConfiguration(
            this IServiceCollection services,
            IWebHostEnvironment env
        )
        {
            services.AddCors(options =>
            {
                options.AddPolicy(
                    "AllowAll",
                    policy =>
                    {
                        policy
                            .SetIsOriginAllowed(origin => true)
                            .AllowAnyHeader()
                            .AllowAnyMethod()
                            .AllowCredentials();
                    }
                );
                /*                  TODO: W przyszłości możemy dodać politykę dla produkcji:
                 */if (env.IsProduction())
                {
                    options.AddPolicy(
                        "Production",
                        policy =>
                        {
                            policy
                                .WithOrigins("https://vocare.pl", "https://www.vocare.pl")
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials();
                        }
                    );
                }
            });

            return services;
        }
    }
}
