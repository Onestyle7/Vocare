using VocareWebAPI.Billing.Configuration;
using VocareWebAPI.CareerAdvisor.Models.Config;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.JobOffers.Configuration;
using VocareWebAPI.JobOffers.Models.Options;
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
            services.Configure<UserRegistrationConfig>(
                configuration.GetSection("UserRegistration")
            );
            services.Configure<JobOfferSyncSettings>(
                configuration.GetSection(JobOfferSyncSettings.SectionName)
            );
            services
                .AddOptions<CvLimitsConfig>()
                .BindConfiguration(CvLimitsConfig.SectionName)
                .ValidateDataAnnotations()
                .ValidateOnStart();
            services
                .AddOptions<LegalOptions>()
                .BindConfiguration(LegalOptions.SectionName)
                .ValidateDataAnnotations()
                .ValidateOnStart();
            services.Configure<NofluffJobsFetchOptions>(
                configuration.GetSection(NofluffJobsFetchOptions.SectionName)
            );
            return services;
        }
    }
}
