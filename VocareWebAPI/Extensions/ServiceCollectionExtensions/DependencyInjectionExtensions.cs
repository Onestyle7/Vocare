using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Npgsql.Replication;
using VocareWebAPI.Billing.Repositories.Implementations;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Implementations;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.CvGenerator.Repositories.Implementations;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Implementation;
using VocareWebAPI.CvGenerator.Services.Implementations;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.JobRecommendationService.Repositories.Implementations;
using VocareWebAPI.JobRecommendationService.Repositories.Interfaces;
using VocareWebAPI.JobRecommendationService.Services.Interfaces;
using VocareWebAPI.Repositories;
using VocareWebAPI.Repositories.Implementations;
using VocareWebAPI.Repositories.Interfaces;
using VocareWebAPI.Services;
using VocareWebAPI.Services.Implementations;
using VocareWebAPI.UserManagement;
using VocareWebAPI.UserManagement.Interfaces;
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

            // AI services (Główną implementacją jest OpenAI)
            services.AddScoped<IAiService, OpenAIService>();
            services.AddScoped<IMarketAnalysisService, OpenAiMarketAnalysisService>();
            services.AddScoped<
                IJobRecommendationService,
                JobRecommendationService.Services.Implementations.JobRecommendationService
            >();

            // CV Services
            services.AddScoped<ICvManagementService, CvManagementService>();
            services.AddScoped<ICvGenerationService, CvGenerationService>();

            // Billing Services
            services.AddScoped<IBillingService, BillingService>();
            services.AddScoped<IStripeService, StripeService>();

            // Other services
            services.AddScoped<IEmailService, EmailService>();

            return services;
        }

        public static IServiceCollection AddRepositories(this IServiceCollection services)
        {
            // User Repositories
            services.AddScoped<IUserProfileRepository, UserProfileRepository>();
            services.AddScoped<IUserBillingRepository, UserBillingRepository>();

            // Transaction repositories
            services.AddScoped<ITokenTransactionRepository, TokenTransactionRepository>();
            services.AddScoped<IServiceCostRepository, ServiceCostRepository>();

            // Career Repositories
            services.AddScoped<IAiRecommendationRepository, AiRecommendationRepository>();
            services.AddScoped<ICareerStatisticsRepository, CareerStatisticsRepository>();
            services.AddScoped<ISkillDemandRepository, SkillDemandRepository>();
            services.AddScoped<IMarketTrendsRepository, MarketTrendsRepository>();
            services.AddScoped<IJobOfferRepository, JobOfferRepository>();
            // Cv Repositories;
            services.AddScoped<IGeneratedCvRepository, GeneratedCvrepository>();

            return services;
        }
    }
}
