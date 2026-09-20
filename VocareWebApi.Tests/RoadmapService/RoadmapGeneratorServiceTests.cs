using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using VocareWebAPI.Models.OpenAIConfig;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Services.Implementations;
using VocareWebAPI.Shared.Exceptions;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.RoadmapService
{
    /// <summary>
    /// Testy jednostkowe <see cref="RoadmapGeneratorService"/> – wywołanie OpenAI, walidacja
    /// wygenerowanej struktury roadmapy oraz obsługa błędów.
    /// </summary>
    public sealed class RoadmapGeneratorServiceTests
    {
        private static RoadmapGeneratorService CreateSut(FakeHttpMessageHandler handler) =>
            new(
                new HttpClient(handler),
                Options.Create(new OpenAIConfig { ApiKey = "sk-test", Model = "gpt-test" }),
                NullLogger<RoadmapGeneratorService>.Instance
            );

        private static RoadmapGenerationRequest Request() =>
            new()
            {
                CareerPathName = "Backend Developer",
                SuggestedSeniority = "Junior",
                TimeHorizonMonths = 12,
                UserSkills = new List<string>(),
                RequiredSkills = new List<string>(),
            };

        private static string ChatCompletion(object roadmapPayload) =>
            JsonSerializer.Serialize(
                new
                {
                    choices = new[]
                    {
                        new
                        {
                            message = new { content = JsonSerializer.Serialize(roadmapPayload) },
                        },
                    },
                }
            );

        [Fact]
        public async Task GenerateAsync_WhenApiReturnsError_ThrowsAiServiceException()
        {
            await CreateSut(
                    FakeHttpMessageHandler.Returning(HttpStatusCode.InternalServerError, "x")
                )
                .Invoking(s => s.GenerateAsync(Request()))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task GenerateAsync_WhenRoadmapHasNoPhases_ThrowsAiServiceException()
        {
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                ChatCompletion(new { title = "Plan", phases = System.Array.Empty<object>() })
            );

            await CreateSut(handler)
                .Invoking(s => s.GenerateAsync(Request()))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task GenerateAsync_WhenTransportFails_ThrowsAiServiceException()
        {
            await CreateSut(FakeHttpMessageHandler.Throwing(new HttpRequestException("offline")))
                .Invoking(s => s.GenerateAsync(Request()))
                .Should()
                .ThrowAsync<AiServiceException>();
        }

        [Fact]
        public async Task GenerateAsync_HappyPath_ReturnsParsedRoadmap()
        {
            var payload = new
            {
                title = "Droga do Backend Developera",
                isAchievable = true,
                phases = new[]
                {
                    new
                    {
                        title = "Fundamenty",
                        orderIndex = 0,
                        startMonth = 1,
                        endMonth = 4,
                        steps = new[]
                        {
                            new
                            {
                                tempId = "phase1_step1",
                                parentRef = (string?)null,
                                title = "C#",
                                subtitle = "Podstawy języka",
                                topics = new[] { "typy", "funkcje" },
                                stepType = "required",
                                orderIndex = 0,
                            },
                        },
                    },
                },
            };
            var handler = FakeHttpMessageHandler.Returning(
                HttpStatusCode.OK,
                ChatCompletion(payload)
            );

            var result = await CreateSut(handler).GenerateAsync(Request());

            result.Title.Should().Be("Droga do Backend Developera");
            result.Phases.Should().ContainSingle();
            result.Phases[0].Steps.Should().ContainSingle().Which.Title.Should().Be("C#");
        }
    }
}
