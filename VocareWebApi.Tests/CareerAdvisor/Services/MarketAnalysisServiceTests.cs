using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Config;
using VocareWebAPI.Models.Dtos.MarketAnalysis;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.Entities.MarketAnalysis;
using VocareWebAPI.Repositories;
using VocareWebAPI.Repositories.Interfaces;
using VocareWebAPI.Services.Implementations;
using Xunit;

namespace VocareWebApi.Tests.CareerAdvisor.Services
{
    public class MarketAnalysisServiceTests
    {
        private readonly Mock<IUserProfileRepository> _mockUserProfileRepo;
        private readonly Mock<ICareerStatisticsRepository> _mockCareerStatsRepo;
        private readonly Mock<ISkillDemandRepository> _mockSkillDemandRepo;
        private readonly Mock<IMarketTrendsRepository> _mockMarketTrendsRepo;
        private readonly Mock<IAiRecommendationRepository> _mockAiRecommendationRepo;
        private readonly Mock<ILogger<MarketAnalysisService>> _mockLogger;
        private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;
        private readonly MarketAnalysisService _service;

        public MarketAnalysisServiceTests()
        {
            // Arrange - inicjalizacja wszystkich mocków
            _mockUserProfileRepo = new Mock<IUserProfileRepository>();
            _mockCareerStatsRepo = new Mock<ICareerStatisticsRepository>();
            _mockSkillDemandRepo = new Mock<ISkillDemandRepository>();
            _mockMarketTrendsRepo = new Mock<IMarketTrendsRepository>();
            _mockAiRecommendationRepo = new Mock<IAiRecommendationRepository>();
            _mockLogger = new Mock<ILogger<MarketAnalysisService>>();

            // Setup HttpClient z mockiem HttpMessageHandler
            _mockHttpMessageHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(_mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://api.test.com/"),
            };

            // Setup konfiguracji
            var config = Options.Create(
                new AiConfig
                {
                    BaseUrl = "https://api.test.com",
                    ApiKey = "test-key",
                    Model = "test-model",
                }
            );

            // Tworzenie instancji serwisu
            _service = new MarketAnalysisService(
                httpClient,
                config,
                _mockUserProfileRepo.Object,
                _mockCareerStatsRepo.Object,
                _mockSkillDemandRepo.Object,
                _mockMarketTrendsRepo.Object,
                _mockAiRecommendationRepo.Object,
                _mockLogger.Object
            );
        }

        [Fact]
        public async Task GetMarketAnalysisAsync_ValidUser_ReturnsAnalysis()
        {
            // Arrange
            var userId = "test-user";
            var recommendationId = Guid.NewGuid();

            var recommendation = new AiRecommendation
            {
                Id = recommendationId,
                UserId = userId,
                PrimaryPath = "Software Developer",
                Justification = "Strong technical skills",
                LongTermGoal = "Become a tech lead",
                CareerPaths = new List<CareerPath>
                {
                    new CareerPath { CareerName = "Backend Developer" },
                    new CareerPath { CareerName = "Full Stack Developer" },
                },
                NextSteps = new List<NextStep>
                {
                    new NextStep { Step = "Learn cloud technologies" },
                },
                UserProfile = new UserProfile
                {
                    UserId = userId,
                    Country = "Poland",
                    Address = "Warsaw",
                },
            };

            _mockAiRecommendationRepo
                .Setup(x => x.GetLatestByUserIdAsync(userId))
                .ReturnsAsync(recommendation);

            // Przygotowanie odpowiedzi AI
            var aiResponse = new
            {
                choices = new[]
                {
                    new
                    {
                        message = new
                        {
                            content = JsonSerializer.Serialize(
                                new
                                {
                                    marketAnalysis = new
                                    {
                                        industryStatistics = new[]
                                        {
                                            new
                                            {
                                                industry = "IT",
                                                minSalary = 8000,
                                                maxSalary = 15000,
                                                employmentRate = 95,
                                                growthForecast = "High growth - 15% annually",
                                            },
                                            new
                                            {
                                                industry = "Software Development",
                                                minSalary = 10000,
                                                maxSalary = 20000,
                                                employmentRate = 92,
                                                growthForecast = "Very high growth - 20% annually",
                                            },
                                            new
                                            {
                                                industry = "Tech Startups",
                                                minSalary = 7000,
                                                maxSalary = 18000,
                                                employmentRate = 88,
                                                growthForecast = "Medium growth - 10% annually",
                                            },
                                        },
                                        skillDemand = new[]
                                        {
                                            new
                                            {
                                                skill = "Python",
                                                demandLevel = "bardzo wysoki",
                                                industry = "IT",
                                            },
                                            new
                                            {
                                                skill = "JavaScript",
                                                demandLevel = "wysoki",
                                                industry = "Software Development",
                                            },
                                            new
                                            {
                                                skill = "Cloud Computing",
                                                demandLevel = "bardzo wysoki",
                                                industry = "IT",
                                            },
                                            new
                                            {
                                                skill = "DevOps",
                                                demandLevel = "wysoki",
                                                industry = "Software Development",
                                            },
                                            new
                                            {
                                                skill = "React",
                                                demandLevel = "średni",
                                                industry = "Tech Startups",
                                            },
                                        },
                                        marketTrends = new[]
                                        {
                                            new
                                            {
                                                trendName = "AI Boom",
                                                description = "Wzrost zapotrzebowania na specjalistów AI i ML",
                                                impact = "Zwiększone zapotrzebowanie na specjalistów o 30%",
                                            },
                                            new
                                            {
                                                trendName = "Remote Work",
                                                description = "Trwała zmiana w kierunku pracy zdalnej",
                                                impact = "Większa konkurencja globalna, ale też więcej możliwości",
                                            },
                                            new
                                            {
                                                trendName = "Cloud Migration",
                                                description = "Migracja firm do rozwiązań chmurowych",
                                                impact = "Wysokie zapotrzebowanie na specjalistów cloud",
                                            },
                                        },
                                    },
                                }
                            ),
                        },
                    },
                },
            };

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(
                    new HttpResponseMessage
                    {
                        StatusCode = HttpStatusCode.OK,
                        Content = new StringContent(
                            JsonSerializer.Serialize(aiResponse),
                            Encoding.UTF8,
                            "application/json"
                        ),
                    }
                )
                .Verifiable();

            // Setup dla operacji delete (czyszczenie starych danych)
            _mockCareerStatsRepo
                .Setup(x => x.DeleteByAiRecommendationIdAsync(recommendationId))
                .Returns(Task.CompletedTask);

            _mockSkillDemandRepo
                .Setup(x => x.DeleteByAiRecommendationIdAsync(recommendationId))
                .Returns(Task.CompletedTask);

            _mockMarketTrendsRepo
                .Setup(x => x.DeleteByAiRecommendationIdAsync(recommendationId))
                .Returns(Task.CompletedTask);

            // Setup dla operacji add
            _mockCareerStatsRepo
                .Setup(x => x.AddAsync(It.IsAny<CareerStatistics>()))
                .Returns(Task.CompletedTask);

            _mockSkillDemandRepo
                .Setup(x => x.AddAsync(It.IsAny<SkillDemand>()))
                .Returns(Task.CompletedTask);

            _mockMarketTrendsRepo
                .Setup(x => x.AddAsync(It.IsAny<MarketTrends>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.GetMarketAnalysisAsync(userId);

            // Assert - weryfikacja struktury odpowiedzi
            result.Should().NotBeNull();
            result.MarketAnalysis.Should().NotBeNull();

            // Weryfikacja statystyk branżowych
            result.MarketAnalysis.IndustryStatistics.Should().HaveCount(3);
            var itStats = result.MarketAnalysis.IndustryStatistics.First(x => x.Industry == "IT");
            itStats.MinSalary.Should().Be(8000);
            itStats.MaxSalary.Should().Be(15000);
            itStats.EmploymentRate.Should().Be(95);
            itStats.GrowthForecast.Should().Contain("15%");

            // Weryfikacja zapotrzebowania na umiejętności
            result.MarketAnalysis.SkillDemand.Should().HaveCount(5);
            var pythonDemand = result.MarketAnalysis.SkillDemand.First(x => x.Skill == "Python");
            pythonDemand.DemandLevel.Should().Be("bardzo wysoki");
            pythonDemand.Industry.Should().Be("IT");

            // Weryfikacja trendów rynkowych
            result.MarketAnalysis.MarketTrends.Should().HaveCount(3);
            var aiTrend = result.MarketAnalysis.MarketTrends.First(x => x.TrendName == "AI Boom");
            aiTrend.Description.Should().Contain("AI i ML");
            aiTrend.Impact.Should().Contain("30%");

            // Weryfikacja wywołań
            _mockHttpMessageHandler
                .Protected()
                .Verify(
                    "SendAsync",
                    Times.Once(),
                    ItExpr.Is<HttpRequestMessage>(req =>
                        req.Method == HttpMethod.Post
                        && req.RequestUri!.ToString().Contains("/chat/completions")
                    ),
                    ItExpr.IsAny<CancellationToken>()
                );

            // Weryfikacja zapisu do bazy
            _mockCareerStatsRepo.Verify(
                x => x.AddAsync(It.IsAny<CareerStatistics>()),
                Times.Exactly(3)
            );
            _mockSkillDemandRepo.Verify(x => x.AddAsync(It.IsAny<SkillDemand>()), Times.Exactly(5));
            _mockMarketTrendsRepo.Verify(
                x => x.AddAsync(It.IsAny<MarketTrends>()),
                Times.Exactly(3)
            );
        }

        [Fact]
        public async Task GetMarketAnalysisAsync_NoRecommendation_ThrowsException()
        {
            // Arrange
            var userId = "test-user";

            _mockAiRecommendationRepo
                .Setup(x => x.GetLatestByUserIdAsync(userId))
                .ReturnsAsync((AiRecommendation)null!);

            // Act & Assert
            var action = async () => await _service.GetMarketAnalysisAsync(userId);

            await action
                .Should()
                .ThrowAsync<Exception>()
                .WithMessage($"AI recommendation for user with ID:{userId} not found.");
        }

        [Fact]
        public async Task GetMarketAnalysisAsync_NoUserProfile_ThrowsException()
        {
            // Arrange
            var userId = "test-user";
            var recommendation = new AiRecommendation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                UserProfile = null!, // Brak profilu użytkownika
            };

            _mockAiRecommendationRepo
                .Setup(x => x.GetLatestByUserIdAsync(userId))
                .ReturnsAsync(recommendation);

            // Act & Assert
            var action = async () => await _service.GetMarketAnalysisAsync(userId);

            await action
                .Should()
                .ThrowAsync<Exception>()
                .WithMessage($"User profile for recommendation {recommendation.Id} not found.");
        }

        [Fact]
        public async Task GetMarketAnalysisAsync_ApiError_ThrowsException()
        {
            // Arrange
            var userId = "test-user";
            var recommendation = CreateTestRecommendation(userId);

            _mockAiRecommendationRepo
                .Setup(x => x.GetLatestByUserIdAsync(userId))
                .ReturnsAsync(recommendation);

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(
                    new HttpResponseMessage
                    {
                        StatusCode = HttpStatusCode.InternalServerError,
                        Content = new StringContent("API Error"),
                    }
                );

            // Act & Assert
            var action = async () => await _service.GetMarketAnalysisAsync(userId);

            await action
                .Should()
                .ThrowAsync<Exception>()
                .WithMessage("Error while calling the AI API.");
        }

        [Fact]
        public async Task GetLatestMarketAnalysisAsync_ValidUser_ReturnsStoredAnalysis()
        {
            // Arrange
            var userId = "test-user";
            var recommendationId = Guid.NewGuid();

            var recommendation = new AiRecommendation { Id = recommendationId, UserId = userId };

            var careerStats = new List<CareerStatistics>
            {
                new CareerStatistics
                {
                    Id = Guid.NewGuid(),
                    CareerName = "Software Developer",
                    AverageSalaryMin = 10000,
                    AverageSalaryMax = 15000,
                    EmploymentRate = 90,
                    GrowthForecast = "High",
                    AiRecommendationId = recommendationId,
                },
            };

            var skillDemands = new List<SkillDemand>
            {
                new SkillDemand
                {
                    Id = Guid.NewGuid(),
                    SkillName = "C#",
                    Industry = "IT",
                    DemandLevel = "wysoki",
                    AiRecommendationId = recommendationId,
                },
            };

            var marketTrends = new List<MarketTrends>
            {
                new MarketTrends
                {
                    Id = Guid.NewGuid(),
                    TrendName = "Digital Transformation",
                    Description = "Cyfryzacja firm",
                    Impact = "Wysokie zapotrzebowanie",
                    AiRecommendationId = recommendationId,
                },
            };

            _mockAiRecommendationRepo
                .Setup(x => x.GetLatestByUserIdAsync(userId))
                .ReturnsAsync(recommendation);

            _mockCareerStatsRepo
                .Setup(x => x.GetByAiRecommendationIdAsync(recommendationId))
                .ReturnsAsync(careerStats);

            _mockSkillDemandRepo
                .Setup(x => x.GetByAiRecommendationIdAsync(recommendationId))
                .ReturnsAsync(skillDemands);

            _mockMarketTrendsRepo
                .Setup(x => x.GetByAiRecommendationIdAsync(recommendationId))
                .ReturnsAsync(marketTrends);

            // Act
            var result = await _service.GetLatestMarketAnalysisAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.MarketAnalysis.IndustryStatistics.Should().HaveCount(1);
            result.MarketAnalysis.IndustryStatistics[0].Industry.Should().Be("Software Developer");
            result.MarketAnalysis.IndustryStatistics[0].MinSalary.Should().Be(10000);

            result.MarketAnalysis.SkillDemand.Should().HaveCount(1);
            result.MarketAnalysis.SkillDemand[0].Skill.Should().Be("C#");

            result.MarketAnalysis.MarketTrends.Should().HaveCount(1);
            result.MarketAnalysis.MarketTrends[0].TrendName.Should().Be("Digital Transformation");
        }

        [Fact]
        public async Task GetMarketAnalysisAsync_HandlesJsonInMarkdownBlocks()
        {
            // Arrange
            var userId = "test-user";
            var recommendation = CreateTestRecommendation(userId);

            _mockAiRecommendationRepo
                .Setup(x => x.GetLatestByUserIdAsync(userId))
                .ReturnsAsync(recommendation);

            // Odpowiedź z JSON w bloku markdown
            var jsonContent =
                @"{
                ""marketAnalysis"": {
                    ""industryStatistics"": [{
                        ""industry"": ""IT"",
                        ""minSalary"": 5000,
                        ""maxSalary"": 10000,
                        ""employmentRate"": 85,
                        ""growthForecast"": ""Medium""
                    }],
                    ""skillDemand"": [],
                    ""marketTrends"": []
                }
            }";

            var aiResponse = new
            {
                choices = new[]
                {
                    new { message = new { content = $"```json\n{jsonContent}\n```" } },
                },
            };

            SetupHttpResponse(aiResponse);
            SetupRepositoryMocks(recommendation.Id);

            // Act
            var result = await _service.GetMarketAnalysisAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.MarketAnalysis.IndustryStatistics.Should().HaveCount(1);
            result.MarketAnalysis.IndustryStatistics[0].Industry.Should().Be("IT");
        }

        // Helper methods
        private AiRecommendation CreateTestRecommendation(string userId)
        {
            return new AiRecommendation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PrimaryPath = "Test Path",
                Justification = "Test",
                LongTermGoal = "Test Goal",
                CareerPaths = new List<CareerPath>
                {
                    new CareerPath { CareerName = "Test Career" },
                },
                NextSteps = new List<NextStep> { new NextStep { Step = "Test Step" } },
                UserProfile = new UserProfile
                {
                    UserId = userId,
                    Country = "Poland",
                    Address = "Warsaw",
                },
            };
        }

        private void SetupHttpResponse(object responseContent)
        {
            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(
                    new HttpResponseMessage
                    {
                        StatusCode = HttpStatusCode.OK,
                        Content = new StringContent(
                            JsonSerializer.Serialize(responseContent),
                            Encoding.UTF8,
                            "application/json"
                        ),
                    }
                );
        }

        private void SetupRepositoryMocks(Guid recommendationId)
        {
            _mockCareerStatsRepo
                .Setup(x => x.DeleteByAiRecommendationIdAsync(recommendationId))
                .Returns(Task.CompletedTask);

            _mockSkillDemandRepo
                .Setup(x => x.DeleteByAiRecommendationIdAsync(recommendationId))
                .Returns(Task.CompletedTask);

            _mockMarketTrendsRepo
                .Setup(x => x.DeleteByAiRecommendationIdAsync(recommendationId))
                .Returns(Task.CompletedTask);

            _mockCareerStatsRepo
                .Setup(x => x.AddAsync(It.IsAny<CareerStatistics>()))
                .Returns(Task.CompletedTask);

            _mockSkillDemandRepo
                .Setup(x => x.AddAsync(It.IsAny<SkillDemand>()))
                .Returns(Task.CompletedTask);

            _mockMarketTrendsRepo
                .Setup(x => x.AddAsync(It.IsAny<MarketTrends>()))
                .Returns(Task.CompletedTask);
        }
    }
}
