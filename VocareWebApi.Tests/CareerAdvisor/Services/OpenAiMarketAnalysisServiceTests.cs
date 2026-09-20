using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.CareerAdvisor.Exceptions;
using VocareWebAPI.CareerAdvisor.Models.Entities.MarketAnalysis;
using VocareWebAPI.CareerAdvisor.Repositories.Interfaces;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.Entities.MarketAnalysis;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Repositories;
using VocareWebAPI.Repositories.Interfaces;
using VocareWebAPI.Shared.Exceptions;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.CareerAdvisor.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="OpenAiMarketAnalysisService"/> – generowanie analizy rynku
    /// (parsowanie odpowiedzi, zapis do repozytoriów) oraz odczyt zapisanej analizy.
    /// </summary>
    public sealed class OpenAiMarketAnalysisServiceTests
    {
        private const string UserId = "user-123";

        private readonly Mock<ICareerStatisticsRepository> _careerStats = new();
        private readonly Mock<ISkillDemandRepository> _skillDemand = new();
        private readonly Mock<IMarketTrendsRepository> _marketTrends = new();
        private readonly Mock<IAiRecommendationRepository> _recommendations = new();
        private readonly Mock<ISalaryProgressionRepository> _salary = new();
        private readonly Mock<IWorkAttributesRepository> _workAttributes = new();
        private readonly Mock<IEntryDifficultyRepository> _entryDifficulty = new();
        private readonly Mock<IAiNarratorRepository> _narrator = new();

        private OpenAiMarketAnalysisService CreateSut(FakeHttpMessageHandler handler) =>
            new(
                new HttpClient(handler),
                Options.Create(new OpenAIConfig { ApiKey = "sk-test", Model = "gpt-test" }),
                _careerStats.Object,
                _skillDemand.Object,
                _marketTrends.Object,
                _recommendations.Object,
                NullLogger<OpenAiMarketAnalysisService>.Instance,
                _salary.Object,
                _workAttributes.Object,
                _entryDifficulty.Object,
                _narrator.Object
            );

        private static AiRecommendation RecommendationWithProfile() =>
            new()
            {
                Id = Guid.NewGuid(),
                UserId = UserId,
                PrimaryPath = "Backend Developer",
                Justification = "Fits",
                LongTermGoal = "Architect",
                UserProfile = new UserProfile { UserId = UserId, Country = "Poland" },
            };

        private static string ChatCompletion(object marketAnalysisPayload) =>
            JsonSerializer.Serialize(
                new
                {
                    choices = new[]
                    {
                        new
                        {
                            message = new
                            {
                                content = JsonSerializer.Serialize(marketAnalysisPayload),
                            },
                        },
                    },
                }
            );

        private static object SampleMarketAnalysis() =>
            new
            {
                marketAnalysis = new
                {
                    industryStatistics = new[]
                    {
                        new
                        {
                            industry = "Backend Developer",
                            minSalary = 8000,
                            maxSalary = 16000,
                            employmentRate = 70,
                            growthForecast = "Stabilnie",
                        },
                    },
                    skillDemand = new[]
                    {
                        new
                        {
                            skill = "C#",
                            demandLevel = "wysoki",
                            industry = "IT",
                        },
                    },
                    marketTrends = new[]
                    {
                        new
                        {
                            trendName = "Powrót do biur",
                            description = "Więcej ofert hybrydowych",
                            impact = "Mniej ofert w pełni zdalnych",
                        },
                    },
                },
            };

        // ---------- GetMarketAnalysisAsync ----------

        [Fact]
        public async Task GetMarketAnalysisAsync_WhenNoRecommendation_ThrowsRecommendationNotFound()
        {
            _recommendations
                .Setup(r => r.GetLatestByUserIdAsync(UserId))
                .ReturnsAsync((AiRecommendation?)null);

            await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .Invoking(s => s.GetMarketAnalysisAsync(UserId))
                .Should()
                .ThrowAsync<RecommendationNotFoundException>();
        }

        [Fact]
        public async Task GetMarketAnalysisAsync_WhenProfileNotLoaded_ThrowsInvalidOperation()
        {
            _recommendations
                .Setup(r => r.GetLatestByUserIdAsync(UserId))
                .ReturnsAsync(new AiRecommendation { Id = Guid.NewGuid(), UserId = UserId });

            await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .Invoking(s => s.GetMarketAnalysisAsync(UserId))
                .Should()
                .ThrowAsync<InvalidOperationException>();
        }

        [Fact]
        public async Task GetMarketAnalysisAsync_WhenApiFails_ThrowsAiServiceException()
        {
            _recommendations
                .Setup(r => r.GetLatestByUserIdAsync(UserId))
                .ReturnsAsync(RecommendationWithProfile());

            await CreateSut(
                    FakeHttpMessageHandler.Returning(HttpStatusCode.InternalServerError, "err")
                )
                .Invoking(s => s.GetMarketAnalysisAsync(UserId))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task GetMarketAnalysisAsync_HappyPath_PersistsAnalysisAndBumpsCounter()
        {
            var recommendation = RecommendationWithProfile();
            _recommendations
                .Setup(r => r.GetLatestByUserIdAsync(UserId))
                .ReturnsAsync(recommendation);
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                ChatCompletion(SampleMarketAnalysis())
            );

            var result = await CreateSut(handler).GetMarketAnalysisAsync(UserId);

            result.MarketAnalysis.IndustryStatistics.Should().ContainSingle();
            result.MarketAnalysis.SkillDemand.Should().ContainSingle();
            result.MarketAnalysis.MarketTrends.Should().ContainSingle();

            _careerStats.Verify(
                r => r.DeleteByAiRecommendationIdAsync(recommendation.Id),
                Times.Once
            );
            _skillDemand.Verify(
                r => r.DeleteByAiRecommendationIdAsync(recommendation.Id),
                Times.Once
            );
            _marketTrends.Verify(
                r => r.DeleteByAiRecommendationIdAsync(recommendation.Id),
                Times.Once
            );
            _careerStats.Verify(r => r.AddAsync(It.IsAny<CareerStatistics>()), Times.Once);
            _skillDemand.Verify(r => r.AddAsync(It.IsAny<SkillDemand>()), Times.Once);
            _marketTrends.Verify(r => r.AddAsync(It.IsAny<MarketTrends>()), Times.Once);
            _recommendations.Verify(
                r => r.IncrementMarketAnalysisCountAsync(recommendation.Id),
                Times.Once
            );
        }

        // ---------- GetLatestMarketAnalysisAsync ----------

        [Fact]
        public async Task GetLatestMarketAnalysisAsync_WhenNoRecommendation_ThrowsMarketAnalysisNotFound()
        {
            _recommendations
                .Setup(r => r.GetLatestByUserIdAsync(UserId))
                .ReturnsAsync((AiRecommendation?)null);

            await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .Invoking(s => s.GetLatestMarketAnalysisAsync(UserId))
                .Should()
                .ThrowAsync<MarketAnalysisNotFoundException>();
        }

        [Fact]
        public async Task GetLatestMarketAnalysisAsync_BuildsDtoFromStoredRepositories()
        {
            var recommendation = RecommendationWithProfile();
            _recommendations
                .Setup(r => r.GetLatestByUserIdAsync(UserId))
                .ReturnsAsync(recommendation);

            var careerStatId = Guid.NewGuid();
            _careerStats
                .Setup(r => r.GetByAiRecommendationIdAsync(recommendation.Id))
                .ReturnsAsync(
                    new List<CareerStatistics>
                    {
                        new()
                        {
                            Id = careerStatId,
                            CareerName = "Backend Developer",
                            AverageSalaryMin = 8000,
                            AverageSalaryMax = 16000,
                            EmploymentRate = 70,
                            GrowthForecast = "Stabilnie",
                        },
                    }
                );
            _skillDemand
                .Setup(r => r.GetByAiRecommendationIdAsync(recommendation.Id))
                .ReturnsAsync(
                    new List<SkillDemand>
                    {
                        new()
                        {
                            SkillName = "C#",
                            DemandLevel = "wysoki",
                            Industry = "IT",
                        },
                    }
                );
            _marketTrends
                .Setup(r => r.GetByAiRecommendationIdAsync(recommendation.Id))
                .ReturnsAsync(new List<MarketTrends>());
            _salary
                .Setup(r => r.GetByCareerStatisticsIdAsync(careerStatId))
                .ReturnsAsync(new List<SalaryProgression>());
            _workAttributes
                .Setup(r => r.GetByCareerStatisticsIdAsync(careerStatId))
                .ReturnsAsync((WorkAttributes?)null);
            _entryDifficulty
                .Setup(r => r.GetByCareerStatisticsIdAsync(careerStatId))
                .ReturnsAsync((EntryDifficulty?)null);
            _narrator
                .Setup(r => r.GetByCareerStatisticsIdAsync(careerStatId))
                .ReturnsAsync((AiNarrator?)null);

            var result = await CreateSut(FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}"))
                .GetLatestMarketAnalysisAsync(UserId);

            result.MarketAnalysis.IndustryStatistics.Should().ContainSingle();
            result.MarketAnalysis.IndustryStatistics[0].Industry.Should().Be("Backend Developer");
            result.MarketAnalysis.IndustryStatistics[0].MinSalary.Should().Be(8000);
            result
                .MarketAnalysis.SkillDemand.Should()
                .ContainSingle()
                .Which.Skill.Should()
                .Be("C#");
        }
    }
}
