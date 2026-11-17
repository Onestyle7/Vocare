using VocareWebAPI.Billing.Configuration;
using VocareWebAPI.CareerAdvisor.Models.Config;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.JobOffers.Configuration;
using VocareWebAPI.JobOffers.Models.Options;
using VocareWebAPI.Legal.Configuration;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Shared.Configuration;
using VocareWebAPI.UserManagement.Configuration;
using VocareWebAPI.UserManagement.Models.Entities;

namespace VocareWebAPI.Extensions.ServiceCollectionExtensions
{
    public static class ConfigurationsExtensions
    {
        public static IServiceCollection AddConfiguration(
            this IServiceCollection services,
            IConfiguration configuration,
            IHostEnvironment environment
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
                .AddOptions<CookieConsentConfig>()
                .BindConfiguration(CookieConsentConfig.SectionName)
                .ValidateDataAnnotations()
                .ValidateOnStart();
            services
                .AddOptions<LegalOptions>()
                .BindConfiguration(LegalOptions.SectionName)
                .Configure(options => options.FrontendUrl = configuration["Frontend:Url"] ?? "")
                .ValidateDataAnnotations()
                .ValidateOnStart();
            services.Configure<NofluffJobsFetchOptions>(
                configuration.GetSection(NofluffJobsFetchOptions.SectionName)
            );
            services
                .AddOptions<AntiAbuseOptions>()
                .BindConfiguration(AntiAbuseOptions.SectionName)
                .Validate(
                    opt => !string.IsNullOrWhiteSpace(opt.EmailHashKey),
                    "AntiAbuse:EmailHashKey configuration is missing or empty."
                )
                .ValidateOnStart();
            services
                .AddOptions<InternalApiOptions>()
                .BindConfiguration(InternalApiOptions.SectionName)
                .Validate(
                    opt => !string.IsNullOrWhiteSpace(opt.Key),
                    "InternalApi:Key configuration is missing or empty."
                )
                .ValidateOnStart();

            services
                .AddOptions<TrialConfig>()
                .BindConfiguration(TrialConfig.SectionName)
                .ValidateDataAnnotations()
                .ValidateOnStart();
            services
                .AddOptions<ConsentDiscountConfig>()
                .BindConfiguration(ConsentDiscountConfig.SectionName)
                .ValidateDataAnnotations()
                .Validate(
                    opt => opt.IsEnabled || !environment.IsProduction(),
                    "ConsentDiscount:CouponId is required in production – the consent discount is promised by the terms (§ 9)."
                )
                .ValidateOnStart();
            return services;
        }
    }
}
