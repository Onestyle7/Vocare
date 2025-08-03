using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
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
            _mockUserProfileRepo = new Mock<IUserProfileRepository>();
            _mockCareerStatsRepo = new Mock<ICareerStatisticsRepository>();
            _mockSkillDemandRepo = new Mock<ISkillDemandRepository>();
            _mockMarketTrendsRepo = new Mock<IMarketTrendsRepository>();
            _mockAiRecommendationRepo = new Mock<IAiRecommendationRepository>();
            _mockLogger = new Mock<ILogger<MarketAnalysisService>>();

            // Setup HttpClient
            _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            var httpClient = new HttpClient(_mockHttpMessageHandler.Object);

            // Setup configuration
            var config = Options.Create(
                new AiConfig
                {
                    BaseUrl = "https://api.test.com",
                    ApiKey = "test-key",
                    Model = "test-model",
                }
            );

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
            var recommendation = new AiRecommendation
            {
                Id = Guid.NewGuid(),
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
                                                growthForecast = "High",
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
                                        },
                                        marketTrends = new[]
                                        {
                                            new
                                            {
                                                trendName = "AI Boom",
                                                description = "Wzrost zapotrzebowania na AI",
                                                impact = "Wysokie zapotrzebowanie na specjalistów",
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
                        Content = new StringContent(JsonSerializer.Serialize(aiResponse)),
                    }
                );

            // Act
            var result = await _service.GetMarketAnalysisAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.MarketAnalysis.IndustryStatistics.Should().HaveCount(1);
            result.MarketAnalysis.IndustryStatistics[0].Industry.Should().Be("IT");
            result.MarketAnalysis.IndustryStatistics[0].MinSalary.Should().Be(8000);
            result.MarketAnalysis.IndustryStatistics[0].MaxSalary.Should().Be(15000);

            // Verify saves
            _mockCareerStatsRepo.Verify(x => x.AddAsync(It.IsAny<CareerStatistics>()), Times.Once);
            _mockSkillDemandRepo.Verify(x => x.AddAsync(It.IsAny<SkillDemand>()), Times.Once);
            _mockMarketTrendsRepo.Verify(x => x.AddAsync(It.IsAny<MarketTrends>()), Times.Once);
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
            var exception = await Assert.ThrowsAsync<Exception>(
                () => _service.GetMarketAnalysisAsync(userId)
            );

            exception
                .Message.Should()
                .Contain($"AI recommendation for user with ID:{userId} not found");
        }
    }
}
