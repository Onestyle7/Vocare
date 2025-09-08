using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.CareerAdvisor.Models.Config;
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
            services.Configure<OpenAiConfig>(configuration.GetSection("OpenAI"));
            services.Configure<PerplexityConfig>(configuration.GetSection("PerplexityAI"));
            services.Configure<UserRegistrationConfig>(
                configuration.GetSection("UserRegistration")
            );

            return services;
        }
    }
}
