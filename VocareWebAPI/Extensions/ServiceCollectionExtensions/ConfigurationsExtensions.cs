using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Config;
using VocareWebAPI.UserManagement.Models.Entities;

namespace VocareWebAPI.Extensions.ServiceCollectionExtensions
{
    public static class ConfigurationsExtensions
    {
        public static IServiceCollection AddConfiguration(
            this IServiceCollection services,
            IConfiguration configuration
        )
        {
            services.Configure<AiConfig>(configuration.GetSection("PerplexityAI"));
            services.Configure<AiConfig>(configuration.GetSection("OpenAI"));
            services.Configure<UserRegistrationConfig>(
                configuration.GetSection("UserRegistration")
            );

            return services;
        }
    }
}
