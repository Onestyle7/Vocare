using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;

namespace VocareWebAPI.Extensions.ServiceCollectionExtensions
{
    public static class SwaggerExtensions
    {
        /// <summary>
        /// Konfiguruje Swagger/OpenAPI dla dokumentacji API
        /// </summary>
        /// <param name="services"></param>
        /// <returns></returns>
        public static IServiceCollection AddSwaggerConfiguration(this IServiceCollection services)
        {
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc(
                    "v1",
                    new OpenApiInfo
                    {
                        Title = "VocareWebAPI",
                        Version = "v1",
                        Description =
                            "Web API dla aplikacji Vocare - inteligentnego doradcy zawodowego",
                        Contact = new OpenApiContact
                        {
                            Name = "Zespół Vocare",
                            Email = "support@vocare.pl",
                        },
                    }
                );

                c.CustomSchemaIds(type => type.FullName);

                c.AddSecurityDefinition(
                    "Bearer",
                    new OpenApiSecurityScheme
                    {
                        In = ParameterLocation.Header,
                        Description = "Wpisz token JWT w formacie: Bearer {token}",
                        Name = "Authorization",
                        Type = SecuritySchemeType.Http,
                        Scheme = "Bearer",
                        BearerFormat = "JWT",
                    }
                );

                c.AddSecurityRequirement(
                    new OpenApiSecurityRequirement
                    {
                        {
                            new OpenApiSecurityScheme
                            {
                                Reference = new OpenApiReference
                                {
                                    Type = ReferenceType.SecurityScheme,
                                    Id = "Bearer",
                                },
                            },
                            Array.Empty<string>()
                        },
                    }
                );
            });
            return services;
        }

        public static WebApplication UseSwaggerConfiguration(
            this WebApplication app,
            IWebHostEnvironment env
        )
        {
            if (!env.IsProduction())
            {
                app.UseSwagger();

                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint(
                        "/swagger/v1/swagger.json",
                        $"VocareWebAPI {env.EnvironmentName} v1"
                    );
                    c.RoutePrefix = "swagger";

                    if (env.IsDevelopment())
                    {
                        c.DocumentTitle = "Vocare API - Development";
                    }
                    else if (env.IsStaging())
                    {
                        c.DocumentTitle = "Vocare API - STAGING ENVIRONMENT";
                        c.HeadContent =
                            @"
                            <style>
                                .topbar { 
                                    background-color: #ff9800 !important; 
                                }
                                .topbar-wrapper:after { 
                                    content: 'STAGING - Ostrożnie z danymi!';
                                    color: white;
                                    margin-left: 20px;
                                }
                            </style>";
                    }

                    c.DefaultModelsExpandDepth(2);
                    c.DefaultModelRendering(Swashbuckle.AspNetCore.SwaggerUI.ModelRendering.Model);
                    c.DisplayRequestDuration();
                });
            }
            return app;
        }
    }
}
