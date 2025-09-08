using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Polly;
using Polly.Extensions.Http;
using VocareWebAPI.CareerAdvisor.Models.Config;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.JobRecommendationService.Services.Interfaces;
using VocareWebAPI.Models.Config;
using VocareWebAPI.Repositories.Interfaces;
using VocareWebAPI.Services;
using VocareWebAPI.Services.Implementations;

namespace VocareWebAPI.Extensions.ServiceCollectionExtensions
{
    public static class HttpClientExtensions
    {
        public static IServiceCollection AddHttpClients(
            this IServiceCollection services,
            IConfiguration configuration
        )
        {
            // Wspólna polityka retry dla wszystkich
            var retryPolicy = HttpPolicyExtensions
                .HandleTransientHttpError()
                .OrResult(msg => msg.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                .WaitAndRetryAsync(
                    3,
                    retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))
                );

            // Perplexity AI Service
            services
                .AddHttpClient<IAiService, PerplexityAiService>(client =>
                {
                    ConfigureAiClient(client, configuration, "PerplexityAI");
                })
                .AddPolicyHandler(retryPolicy);

            // Market Analysis Service - POPRAWKA: używa PerplexityAI config jak w oryginale
            services
                .AddHttpClient<IMarketAnalysisService, MarketAnalysisService>(client =>
                {
                    ConfigureAiClient(client, configuration, "OpenAI");
                })
                .AddPolicyHandler(retryPolicy);

            // OpenAI Service
            services
                .AddHttpClient<IAiService, OpenAIService>(client =>
                {
                    ConfigureAiClient(client, configuration, "OpenAI");
                    client.Timeout = TimeSpan.FromMinutes(3);
                })
                .AddPolicyHandler(retryPolicy);

            // Job Recommendation Service
            services
                .AddHttpClient<
                    IJobRecommendationService,
                    JobRecommendationService.Services.Implementations.JobRecommendationService
                >(client =>
                {
                    ConfigurePerplexityClient(client, configuration);
                })
                .AddPolicyHandler(retryPolicy);

            return services;
        }

        private static void ConfigurePerplexityClient(
            HttpClient client,
            IConfiguration configuration
        )
        {
            var config = configuration.GetSection("PerplexityAI").Get<PerplexityConfig>();
            if (config == null)
            {
                throw new InvalidOperationException("PerplexityAI configuration is missing");
            }
            client.BaseAddress = new Uri(config.BaseUrl);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.ApiKey}");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        private static void ConfigureAiClient(
            HttpClient client,
            IConfiguration configuration,
            string configSection
        )
        {
            var config = configuration.GetSection(configSection).Get<OpenAiConfig>();
            if (config == null)
            {
                throw new InvalidOperationException(
                    $"Configuration section '{configSection}' is missing"
                );
            }

            client.BaseAddress = new Uri(config.BaseUrl);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.ApiKey}");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
        }
    }
}
