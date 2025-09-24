using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Extensions.ServiceCollectionExtensions
{
    public static class CorsExtensions
    {
        private const string DEVELOPMENT_POLICY = "DevelopmentPolicy";
        private const string STAGING_POLICY = "StagingPolicy";
        private const string PRODUCTION_POLICY = "ProductionPolicy";

        /// <summary>
        /// Konfiguruje CORS dla aplikacji zgodnie ze środowiskiem
        /// </summary>
        public static IServiceCollection AddCorsConfiguration(
            this IServiceCollection services,
            IConfiguration configuration,
            IWebHostEnvironment env
        )
        {
            services.AddCors(options =>
            {
                // Polityka dla Development - najbardziej liberalna
                if (env.IsDevelopment())
                {
                    options.AddPolicy(
                        DEVELOPMENT_POLICY,
                        policy =>
                        {
                            policy
                                .WithOrigins(
                                    "http://localhost:3000",
                                    "http://localhost:4200",
                                    "http://localhost:5173",
                                    "http://127.0.0.1:3000",
                                    "http://127.0.0.1:4200",
                                    "http://127.0.0.1:5173"
                                )
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials()
                                .WithExposedHeaders("Content-Disposition", "Content-Length");
                        }
                    );
                }
                // Polityka dla Staging - kontrolowana ale elastyczna
                else if (env.IsStaging())
                {
                    options.AddPolicy(
                        STAGING_POLICY,
                        policy =>
                        {
                            var stagingOrigins =
                                configuration.GetSection("Cors:StagingOrigins").Get<string[]>()
                                ?? new[]
                                {
                                    "https://vocare-staging.vercel.app",
                                    "https://vocare-staging.vercel.app",
                                    "http://localhost:3000", // dla lokalnego testowania ze staging API
                                    "http://localhost:4200",
                                };

                            policy
                                .WithOrigins(stagingOrigins)
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials()
                                .WithExposedHeaders("Content-Disposition", "Content-Length");
                        }
                    );
                }
                // Polityka dla Production - najbardziej restrykcyjna
                else if (env.IsProduction())
                {
                    options.AddPolicy(
                        PRODUCTION_POLICY,
                        policy =>
                        {
                            var productionOrigins =
                                configuration.GetSection("Cors:ProductionOrigins").Get<string[]>()
                                ?? new[]
                                {
                                    "https://vocare.pl",
                                    "https://www.vocare.pl",
                                    "https://app.vocare.pl",
                                };

                            policy
                                .WithOrigins(productionOrigins)
                                .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                                .WithHeaders(
                                    "Content-Type",
                                    "Authorization",
                                    "X-Requested-With",
                                    "Accept",
                                    "Origin"
                                )
                                .AllowCredentials()
                                .WithExposedHeaders("Content-Disposition", "Content-Length")
                                .SetPreflightMaxAge(TimeSpan.FromHours(24)); // Cache preflight na 24h
                        }
                    );
                }

                // Domyślna polityka fallback - bardzo restrykcyjna
                options.AddDefaultPolicy(policy =>
                {
                    policy
                        .WithOrigins("https://vocare.pl")
                        .WithMethods("GET", "POST")
                        .WithHeaders("Content-Type")
                        .DisallowCredentials();
                });
            });

            return services;
        }

        /// <summary>
        /// Zwraca nazwę polityki CORS dla danego środowiska
        /// </summary>
        public static string GetCorsPolicyName(IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
                return DEVELOPMENT_POLICY;
            if (env.IsStaging())
                return STAGING_POLICY;
            if (env.IsProduction())
                return PRODUCTION_POLICY;

            // Fallback - użyj domyślnej polityki
            return string.Empty;
        }
    }
}
