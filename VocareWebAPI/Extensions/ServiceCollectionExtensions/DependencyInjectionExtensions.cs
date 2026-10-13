using VocareWebAPI.Billing.Repositories.Implementations;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Implementations;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.CareerAdvisor.Repositories.Implementations;
using VocareWebAPI.CareerAdvisor.Repositories.Interfaces;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.CareerAdvisor.Services.Interfaces;
using VocareWebAPI.CvGenerator.Implementations;
using VocareWebAPI.CvGenerator.Interfaces;
using VocareWebAPI.CvGenerator.Repositories.Implementations;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Implementation;
using VocareWebAPI.CvGenerator.Services.Implementations;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.JobOffers.BackgroundJobs;
using VocareWebAPI.JobOffers.Repositories.Implementations;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Implementations;
using VocareWebAPI.JobOffers.Services.Interfaces;
using VocareWebAPI.Legal.Repositories.Implementations;
using VocareWebAPI.Legal.Repositories.Interfaces;
using VocareWebAPI.Legal.Services.Implementations;
using VocareWebAPI.Legal.Services.Interfaces;
using VocareWebAPI.MarketNews.Repositories.Implementations;
using VocareWebAPI.MarketNews.Repositories.Interfaces;
using VocareWebAPI.MarketNews.services.Implementations;
using VocareWebAPI.MarketNews.Services.Implementations;
using VocareWebAPI.MarketNews.Services.Interfaces;
using VocareWebAPI.Notifications.Repositories.Implementations;
using VocareWebAPI.Notifications.Repositories.Interfaces;
using VocareWebAPI.Notifications.Services.Implementations;
using VocareWebAPI.Notifications.Services.Interfaces;
using VocareWebAPI.Repositories;
using VocareWebAPI.Repositories.Implementations;
using VocareWebAPI.Repositories.Interfaces;
using VocareWebAPI.RoadmapService.Jobs.Implementations;
using VocareWebAPI.RoadmapService.Jobs.Interfaces;
using VocareWebAPI.RoadmapService.Repositories.Implementations;
using VocareWebAPI.RoadmapService.Repositories.Interfaces;
using VocareWebAPI.RoadmapService.Services.Implementations;
using VocareWebAPI.RoadmapService.Services.Interfaces;
using VocareWebAPI.Services;
using VocareWebAPI.Shared.Services.Implementations;
using VocareWebAPI.Shared.Services.Interfaces;
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
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IAuthenticationServiceOwn, AuthenticationService>();
            services.AddScoped<ICvParserService, CvParserService>();
            services.AddScoped<IDashboardService, DashboardService>();
            services.AddScoped<IUserDeletionService, UserDeletionService>();

            // AI services (Główną implementacją jest OpenAI)
            services.AddScoped<IAiService, OpenAIService>();

            // CV Services
            services.AddScoped<ICvManagementService, CvManagementService>();
            services.AddScoped<ICvGenerationService, CvGenerationService>();
            services.AddScoped<ICvAnalysisService, CvAnalysisService>();
            services.AddScoped<ICvTailoringService, CvTailoringService>();

            // Billing Services
            services.AddScoped<IBillingService, BillingService>();
            services.AddScoped<IStripeService, StripeService>();
            services.AddScoped<IPurchaseConfirmationService, PurchaseConfirmationService>();

            // Other services
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IMarketNewsService, MarketNewsService>();

            // Roadmap services
            services.AddScoped<ICareerRoadmapService, CareerRoadmapService>();
            services.AddScoped<IRoadmapPhaseService, RoadmapPhaseService>();
            services.AddScoped<IRoadmapStepService, RoadmapStepService>();
            services.AddScoped<IRoadmapGeneratorService, RoadmapGeneratorService>();

            // Jobs services
            services.AddScoped<IJobOfferSyncService, JobOfferSyncService>();
            services.AddScoped<IJobOfferMatchingService, JobOfferMatchingService>();
            services.AddScoped<IJobOfferDetailsService, JobOfferDetailsService>();
            services.AddScoped<ISkillMatchingService, SkillMatchingService>();
            services.AddScoped<IScoringService, ScoringService>();
            services.AddScoped<ISkillEmbeddingService, SkillEmbeddingService>();

            // Background services/jobs
            services.AddHostedService<MarketNewsBackgroundService>();
            services.AddHostedService<JobOfferSyncBackgroundService>();
            services.AddScoped<IRoadmapGenerationJob, RoadmapGenerationJob>();

            // Notification
            services.AddScoped<INotificationService, NotificationService>();

            // Legal
            services.AddScoped<ILegalService, LegalService>();

            // Email hashing (anti abuse)
            services.AddScoped<IEmailHashService, EmailHashService>();

            // End user's IP and User-Agent (forwarded by the Next.js server)
            services.AddHttpContextAccessor();
            services.AddScoped<IClientInfoProvider, ClientInfoProvider>();

            return services;
        }

        public static IServiceCollection AddRepositories(this IServiceCollection services)
        {
            // User Repositories
            services.AddScoped<IUserProfileRepository, UserProfileRepository>();
            services.AddScoped<IUserBillingRepository, UserBillingRepository>();
            services.AddScoped<IMarketingConsentRepository, MarketingConsentRepository>();
            services.AddScoped<ICvParseHistoryRepository, CvParseHistoryRepository>();
            services.AddScoped<IDashboardRepository, DashboardRepository>();
            services.AddScoped<IProfileAttributesRepository, ProfileAttributesRepository>();
            services.AddScoped<IUserDataCleanupRepository, UserDataCleanupRepository>();

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
            services.AddScoped<ICareerPathRepository, CareerPathRepository>();
            // RoadmapRepositories
            services.AddScoped<IRoadmapRepository, RoadmapRepository>();

            // Cv Repositories
            services.AddScoped<IGeneratedCvRepository, GeneratedCvrepository>();
            services.AddScoped<ICvAnalysisRepository, CvAnalysisRepository>();

            // Job Offer repositories
            services.AddScoped<IJobOfferRepository, JobOfferRepository>();
            services.AddScoped<IMarketNewsRepository, MarketNewsRepository>();
            services.AddScoped<
                IJobOfferRecommendationRepository,
                JobOfferRecommendationRepository
            >();
            services.AddScoped<ISkillEmbeddingRepository, SkillEmbeddingRepository>();

            // Notification
            services.AddScoped<INotificationRepository, NotificationRepository>();

            // Legal
            services.AddScoped<ILegalRepository, LegalRepository>();

            // Anti abuse
            services.AddScoped<IAccountAntiAbuseReporitory, AccountAntiAbuseRepository>();

            return services;
        }
    }
}
