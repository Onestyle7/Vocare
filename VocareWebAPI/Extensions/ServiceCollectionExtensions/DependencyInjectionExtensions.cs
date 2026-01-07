using VocareWebAPI.Billing.Repositories.Implementations;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Implementations;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.CareerAdvisor.Repositories.Implementations;
using VocareWebAPI.CareerAdvisor.Repositories.Interfaces;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.CareerAdvisor.Services.Interfaces;
using VocareWebAPI.CvGenerator.Repositories.Implementations;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Implementation;
using VocareWebAPI.CvGenerator.Services.Implementations;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.MarketNews.Repositories.Implementations;
using VocareWebAPI.MarketNews.Repositories.Interfaces;
using VocareWebAPI.MarketNews.services.Implementations;
using VocareWebAPI.MarketNews.Services.Implementations;
using VocareWebAPI.MarketNews.Services.Interfaces;
using VocareWebAPI.Repositories;
using VocareWebAPI.Repositories.Implementations;
using VocareWebAPI.Repositories.Interfaces;
using VocareWebAPI.Services;
using VocareWebAPI.UserManagement;
using VocareWebAPI.UserManagement.Interfaces;
using VocareWebAPI.UserManagement.Repositories;
using VocareWebAPI.UserManagement.Repositories.Implementations;
using VocareWebAPI.UserManagement.Repositories.Interfaces;
using VocareWebAPI.UserManagement.Services;
using VocareWebAPI.UserManagement.Services.Implementations;
using VocareWebAPI.UserManagement.Services.Interfaces;
using AuthenticationService = VocareWebAPI.UserManagement.Services.Implementations.AuthenticationService;

namespace VocareWebAPI.Extensions.ServiceCollectionExtensions
{
    public static class DependencyInjectionExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // User Management services
            services.AddScoped<UserProfileService>();
            services.AddScoped<UserRegistrationHandler>();
            services.AddScoped<IUserSetupService, UserSetupService>();
            services.AddScoped<IAuthenticationServiceOwn, AuthenticationService>();
            services.AddScoped<ICvParserService, CvParserService>();

            // AI services (Główną implementacją jest OpenAI)
            services.AddScoped<IAiService, OpenAIService>();

            // CV Services
            services.AddScoped<ICvManagementService, CvManagementService>();
            services.AddScoped<ICvGenerationService, CvGenerationService>();

            // Billing Services
            services.AddScoped<IBillingService, BillingService>();
            services.AddScoped<IStripeService, StripeService>();

            // Other services
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IMarketNewsService, MarketNewsService>();

            services.AddHostedService<MarketNewsBackgroundService>();

            return services;
        }

        public static IServiceCollection AddRepositories(this IServiceCollection services)
        {
            // User Repositories
            services.AddScoped<IUserProfileRepository, UserProfileRepository>();
            services.AddScoped<IUserBillingRepository, UserBillingRepository>();
            services.AddScoped<IMarketingConsentRepository, MarketingConsentRepository>();
            services.AddScoped<ICvParseHistoryRepository, CvParseHistoryRepository>();

            // Transaction repositories
            services.AddScoped<ITokenTransactionRepository, TokenTransactionRepository>();
            services.AddScoped<IServiceCostRepository, ServiceCostRepository>();

            // Career Repositories
            services.AddScoped<IAiRecommendationRepository, AiRecommendationRepository>();
            services.AddScoped<ICareerStatisticsRepository, CareerStatisticsRepository>();
            services.AddScoped<ISkillDemandRepository, SkillDemandRepository>();
            services.AddScoped<IMarketTrendsRepository, MarketTrendsRepository>();
            services.AddScoped<ISalaryProgressionRepository, SalaryProgressionRepository>();
            services.AddScoped<IWorkAttributesRepository, WorkAttributesRepository>();
            services.AddScoped<IEntryDifficultyRepository, EntryDifficultyRepository>();
            services.AddScoped<IAiNarratorRepository, AiNarratorRepository>();

            // Cv Repositories;
            services.AddScoped<IGeneratedCvRepository, GeneratedCvrepository>();

            services.AddScoped<IMarketNewsRepository, MarketNewsRepository>();
            return services;
        }
    }
}
