using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Polly;
using Polly.Extensions.Http;
using VocareWebAPI.CareerAdvisor.Models.Config;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.MarketNews.Services.Implementations;
using VocareWebAPI.MarketNews.Services.Interfaces;
using VocareWebAPI.Models.OpenAIConfig;
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
                    ConfigurePerplexityClient(client, configuration);
                })
                .AddPolicyHandler(retryPolicy);

            // Market Analysis Service
            services
                .AddHttpClient<IMarketAnalysisService, OpenAiMarketAnalysisService>(client =>
                {
                    ConfigureOpenAIClient(client, configuration);
                    client.Timeout = TimeSpan.FromMinutes(3);
                })
                .AddPolicyHandler(retryPolicy);

            // OpenAI Service
            services
                .AddHttpClient<IAiService, OpenAIService>(client =>
                {
                    ConfigureOpenAIClient(client, configuration);
                    client.Timeout = TimeSpan.FromMinutes(3);
                })
                .AddPolicyHandler(retryPolicy);

            // Market News Service
            services
                .AddHttpClient<IMarketNewsService, MarketNewsService>(client =>
                {
                    ConfigurePerplexityClient(client, configuration);
                    client.Timeout = TimeSpan.FromMinutes(3);
                })
                .AddPolicyHandler(retryPolicy);
            return services;
        }

        private static void ConfigureOpenAIClient(HttpClient client, IConfiguration configuration)
        {
            var config = configuration.GetSection("OpenAI").Get<OpenAIConfig>();
            if (config == null)
                throw new InvalidOperationException("OpenAI configuration section is missing");

            client.BaseAddress = new Uri(config.BaseUrl);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.ApiKey}");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        private static void ConfigurePerplexityClient(
            HttpClient client,
            IConfiguration configuration
        )
        {
            var config = configuration.GetSection("PerplexityAI").Get<PerplexityAIConfig>();
            if (config == null)
                throw new InvalidOperationException(
                    "PerplexityAI configuration section is missing"
                );

            client.BaseAddress = new Uri(config.BaseUrl);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.ApiKey}");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
        }
    }
}
