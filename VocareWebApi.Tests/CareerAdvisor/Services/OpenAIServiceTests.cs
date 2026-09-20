using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Pgvector;
using VocareWebAPI.CareerAdvisor.Exceptions;
using VocareWebAPI.CareerAdvisor.Services.Implementations;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.Profiles;
using VocareWebAPI.Repositories;
using VocareWebAPI.Shared.Exceptions;
using VocareWebAPI.Shared.Services.Interfaces;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.CareerAdvisor.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="OpenAIService"/> – parsowanie odpowiedzi OpenAI, obsługa
    /// błędów API oraz zapis rekomendacji wraz z generowaniem osadzeń.
    /// </summary>
    public sealed class OpenAIServiceTests
    {
        private readonly Mock<IAiRecommendationRepository> _repository = new();
        private readonly Mock<IEmbeddingService> _embedding = new();
        private readonly IMapper _mapper = MapperFactory.Create(typeof(AiRecommendationProfile));

        public OpenAIServiceTests()
        {
            _embedding
                .Setup(e => e.GenerateEmbeddingAsync(It.IsAny<string>()))
                .ReturnsAsync(new Vector(new float[] { 0.1f, 0.2f }));
        }

        private OpenAIService CreateSut(FakeHttpMessageHandler handler)
        {
            var httpClient = new HttpClient(handler)
            {
                BaseAddress = new Uri("https://api.openai.com"),
            };
            return new OpenAIService(
                httpClient,
                Options.Create(new OpenAIConfig { ApiKey = "sk-test", Model = "gpt-test" }),
                _repository.Object,
                _mapper,
                NullLogger<OpenAIService>.Instance,
                _embedding.Object
            );
        }

        private static UserProfile Profile() =>
            new()
            {
                UserId = "user-123",
                FirstName = "Ada",
                LastName = "Byron",
            };

        private static string ChatCompletion(string content) =>
            JsonSerializer.Serialize(new { choices = new[] { new { message = new { content } } } });

        private static string CareerResponseJson() =>
            JsonSerializer.Serialize(
                new
                {
                    careerPaths = new[]
                    {
                        new
                        {
                            careerName = "Backend Developer",
                            description = "Builds APIs",
                            probability = 82,
                            requiredSkills = new[] { "C#", "SQL" },
                        },
                    },
                    recommendation = new
                    {
                        primaryPath = "Backend Developer",
                        justification = "Fits skills",
                        nextSteps = new[] { "Practice SQL" },
                        longTermGoal = "Architect",
                    },
                }
            );

        [Fact]
        public async Task GetCareerRecommendationsAsync_WhenApiReturnsError_ThrowsAiServiceException()
        {
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.InternalServerError,
                "boom"
            );

            await CreateSut(handler)
                .Invoking(s => s.GetCareerRecommendationsAsync(Profile()))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task GetCareerRecommendationsAsync_WhenNoChoices_ThrowsAiServiceException()
        {
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                JsonSerializer.Serialize(new { choices = Array.Empty<object>() })
            );

            await CreateSut(handler)
                .Invoking(s => s.GetCareerRecommendationsAsync(Profile()))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task GetCareerRecommendationsAsync_WhenChoiceContentEmpty_ThrowsAiServiceException()
        {
            var handler = FakeHttpMessageHandler.Returning(HttpStatusCode.OK, ChatCompletion(""));

            await CreateSut(handler)
                .Invoking(s => s.GetCareerRecommendationsAsync(Profile()))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task GetCareerRecommendationsAsync_WhenTransportFails_ThrowsAiServiceException()
        {
            var handler = FakeHttpMessageHandler.Throwing(new HttpRequestException("offline"));

            await CreateSut(handler)
                .Invoking(s => s.GetCareerRecommendationsAsync(Profile()))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task GetCareerRecommendationsAsync_HappyPath_SavesRecommendationAndReturnsParsedResult()
        {
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                ChatCompletion(CareerResponseJson())
            );

            var result = await CreateSut(handler).GetCareerRecommendationsAsync(Profile());

            result.CareerPaths.Should().ContainSingle();
            result.CareerPaths[0].CareerName.Should().Be("Backend Developer");
            result.Recommendation.PrimaryPath.Should().Be("Backend Developer");
            _repository.Verify(
                r => r.AddRecommendationAsync(It.Is<AiRecommendation>(a => a.UserId == "user-123")),
                Times.Once
            );
            _embedding.Verify(e => e.GenerateEmbeddingAsync(It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task GetCareerRecommendationsAsync_WhenEmbeddingFails_StillSavesRecommendation()
        {
            _embedding
                .Setup(e => e.GenerateEmbeddingAsync(It.IsAny<string>()))
                .ThrowsAsync(new InvalidOperationException("embedding down"));
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                ChatCompletion(CareerResponseJson())
            );

            var result = await CreateSut(handler).GetCareerRecommendationsAsync(Profile());

            result.Should().NotBeNull();
            _repository.Verify(
                r => r.AddRecommendationAsync(It.IsAny<AiRecommendation>()),
                Times.Once
            );
        }

        [Fact]
        public async Task GetLastRecommendationAsync_WhenMissing_ThrowsRecommendationNotFound()
        {
            _repository
                .Setup(r => r.GetLatestByUserIdAsync("user-123"))
                .ReturnsAsync((AiRecommendation?)null);
            var handler = FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}");

            await CreateSut(handler)
                .Invoking(s => s.GetLastRecommendationAsync("user-123"))
                .Should()
                .ThrowAsync<RecommendationNotFoundException>();
        }

        [Fact]
        public async Task GetLastRecommendationAsync_MapsStoredEntityToDto()
        {
            _repository
                .Setup(r => r.GetLatestByUserIdAsync("user-123"))
                .ReturnsAsync(
                    new AiRecommendation
                    {
                        UserId = "user-123",
                        PrimaryPath = "Backend Developer",
                        Justification = "Fits",
                        LongTermGoal = "Architect",
                        NextSteps = new List<NextStep> { new() { Step = "Practice SQL" } },
                        CareerPaths = new List<CareerPath>
                        {
                            new()
                            {
                                CareerName = "Backend Developer",
                                Description = "APIs",
                                Probability = "82",
                            },
                        },
                    }
                );
            var handler = FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}");

            var dto = await CreateSut(handler).GetLastRecommendationAsync("user-123");

            dto.Recommendation.PrimaryPath.Should().Be("Backend Developer");
            dto.Recommendation.NextSteps.Should().ContainSingle().Which.Should().Be("Practice SQL");
            dto.CareerPaths.Should().ContainSingle();
            dto.CareerPaths[0].Probability.Should().Be(82);
        }
    }
}
