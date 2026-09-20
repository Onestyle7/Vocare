using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.CareerAdvisor.Models.Config;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Profiles;
using VocareWebAPI.Repositories;
using VocareWebAPI.Services;
using VocareWebAPI.Shared.Exceptions;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.CareerAdvisor.Services
{
    /// <summary>
    /// Testy jednostkowe <see cref="PerplexityAiService"/> – wyciąganie JSON z odpowiedzi
    /// (również z bloków markdown) oraz obsługa błędów komunikacji i parsowania.
    /// </summary>
    public sealed class PerplexityAiServiceTests
    {
        private readonly Mock<IAiRecommendationRepository> _repository = new();
        private readonly IMapper _mapper = MapperFactory.Create(typeof(AiRecommendationProfile));

        private PerplexityAiService CreateSut(FakeHttpMessageHandler handler) =>
            new(
                Options.Create(
                    new PerplexityAIConfig
                    {
                        BaseUrl = "https://api.perplexity.ai",
                        ApiKey = "pplx-test",
                        Model = "sonar",
                    }
                ),
                new HttpClient(handler),
                _repository.Object,
                _mapper
            );

        private static UserProfile Profile() => new() { UserId = "user-123", FirstName = "Ada" };

        private static string Envelope(string content) =>
            JsonSerializer.Serialize(new { choices = new[] { new { message = new { content } } } });

        private static string CareerResponseJson() =>
            JsonSerializer.Serialize(
                new
                {
                    careerPaths = new[]
                    {
                        new { careerName = "Data Analyst", description = "Analyses data" },
                    },
                    recommendation = new
                    {
                        primaryPath = "Data Analyst",
                        justification = "Fits",
                        nextSteps = new[] { "Learn Power BI" },
                        longTermGoal = "Data Scientist",
                    },
                }
            );

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
        public async Task GetCareerRecommendationsAsync_WhenContentBlank_ThrowsAiServiceException()
        {
            var handler = FakeHttpMessageHandler.Returning(HttpStatusCode.OK, Envelope("   "));

            await CreateSut(handler)
                .Invoking(s => s.GetCareerRecommendationsAsync(Profile()))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task GetCareerRecommendationsAsync_WhenContentNotJson_ThrowsAiServiceException()
        {
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                Envelope("I could not help with that.")
            );

            await CreateSut(handler)
                .Invoking(s => s.GetCareerRecommendationsAsync(Profile()))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task GetCareerRecommendationsAsync_WithPlainJsonContent_SavesAndReturns()
        {
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                Envelope(CareerResponseJson())
            );

            var result = await CreateSut(handler).GetCareerRecommendationsAsync(Profile());

            result.CareerPaths.Should().ContainSingle();
            result.CareerPaths[0].CareerName.Should().Be("Data Analyst");
            _repository.Verify(
                r => r.AddRecommendationAsync(It.Is<AiRecommendation>(a => a.UserId == "user-123")),
                Times.Once
            );
        }

        [Fact]
        public async Task GetCareerRecommendationsAsync_WithMarkdownWrappedJson_ExtractsAndParses()
        {
            var wrapped = $"Oto wynik:\n```json\n{CareerResponseJson()}\n```\nGotowe.";
            var handler = FakeHttpMessageHandler.Returning(HttpStatusCode.OK, Envelope(wrapped));

            var result = await CreateSut(handler).GetCareerRecommendationsAsync(Profile());

            result.Recommendation.PrimaryPath.Should().Be("Data Analyst");
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
        public async Task GetLastRecommendationAsync_WhenMissing_ThrowsAiServiceException()
        {
            _repository
                .Setup(r => r.GetLatestByUserIdAsync("user-123"))
                .ReturnsAsync((AiRecommendation?)null);
            var handler = FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}");

            await CreateSut(handler)
                .Invoking(s => s.GetLastRecommendationAsync("user-123"))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task GetLastRecommendationAsync_MapsStoredEntity()
        {
            _repository
                .Setup(r => r.GetLatestByUserIdAsync("user-123"))
                .ReturnsAsync(
                    new AiRecommendation
                    {
                        UserId = "user-123",
                        PrimaryPath = "Data Analyst",
                        Justification = "Fits",
                        LongTermGoal = "Data Scientist",
                        NextSteps = new List<NextStep> { new() { Step = "Learn SQL" } },
                    }
                );
            var handler = FakeHttpMessageHandler.Returning(HttpStatusCode.OK, "{}");

            var dto = await CreateSut(handler).GetLastRecommendationAsync("user-123");

            dto.Recommendation.PrimaryPath.Should().Be("Data Analyst");
            dto.Recommendation.NextSteps.Should().ContainSingle().Which.Should().Be("Learn SQL");
        }
    }
}
