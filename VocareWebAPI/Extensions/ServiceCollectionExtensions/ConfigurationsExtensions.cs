using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Billing.Models.Config;
using VocareWebAPI.CareerAdvisor.Models.Config;
using VocareWebAPI.JobOffers.Configuration;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.Models.OpenAIConfig;
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
            services.Configure<PerplexityAIConfig>(configuration.GetSection("PerplexityAI"));
            services.Configure<OpenAIConfig>(configuration.GetSection("OpenAI"));
            services.Configure<DeveloperAccessConfig>(
                configuration.GetSection("DeveloperAccess")
            );
            services.Configure<UserRegistrationConfig>(
                configuration.GetSection("UserRegistration")
            );
            services.Configure<JobOfferSyncSettings>(
                configuration.GetSection(JobOfferSyncSettings.SectionName)
            );

            return services;
        }
    }
}
