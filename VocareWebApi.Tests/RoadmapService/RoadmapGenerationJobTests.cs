using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using VocareWebAPI.Notifications.Models.Enums;
using VocareWebAPI.Notifications.Services.Interfaces;
using VocareWebAPI.RoadmapService.Exceptions;
using VocareWebAPI.RoadmapService.Jobs.Implementations;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;
using VocareWebAPI.RoadmapService.Repositories.Interfaces;
using VocareWebAPI.RoadmapService.Services.Interfaces;
using VocareWebAPI.Shared.Exceptions;
using Xunit;

namespace VocareWebApi.Tests.RoadmapService
{
    /// <summary>
    /// Testy jednostkowe zadania w tle <see cref="RoadmapGenerationJob"/> – idempotencja,
    /// budowanie grafu roadmapy oraz obsługa niepowodzeń generacji.
    /// </summary>
    public sealed class RoadmapGenerationJobTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IRoadmapRepository> _roadmaps = new();
        private readonly Mock<IRoadmapGeneratorService> _generator = new();
        private readonly Mock<INotificationService> _notifications = new();
        private readonly RoadmapGenerationJob _sut;

        public RoadmapGenerationJobTests()
        {
            _sut = new RoadmapGenerationJob(
                _roadmaps.Object,
                _generator.Object,
                _notifications.Object
            );
        }

        private static Roadmap PendingRoadmap(Guid id) =>
            new()
            {
                Id = id,
                UserId = UserId,
                GenerationStatus = GenerationStatus.Pending,
                Phases = new List<RoadmapPhase>(),
            };

        private static RoadmapGenerationRequest Request() =>
            new()
            {
                CareerPathName = "Backend Developer",
                SuggestedSeniority = "Junior",
                TimeHorizonMonths = 12,
                UserSkills = new List<string>(),
                RequiredSkills = new List<string>(),
            };

        [Fact]
        public async Task GenerateAsync_WhenRoadmapMissing_ThrowsRoadmapNotFound()
        {
            _roadmaps.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Roadmap?)null);

            await _sut.Invoking(j => j.GenerateAsync(Guid.NewGuid(), Request(), null!))
                .Should()
                .ThrowAsync<RoadmapNotFoundException>();
        }

        [Fact]
        public async Task GenerateAsync_WhenRoadmapAlreadyReady_SkipsGeneration()
        {
            var id = Guid.NewGuid();
            _roadmaps
                .Setup(r => r.GetByIdAsync(id))
                .ReturnsAsync(
                    new Roadmap
                    {
                        Id = id,
                        UserId = UserId,
                        GenerationStatus = GenerationStatus.Ready,
                    }
                );

            await _sut.GenerateAsync(id, Request(), null!);

            _generator.Verify(
                g => g.GenerateAsync(It.IsAny<RoadmapGenerationRequest>()),
                Times.Never
            );
        }

        [Fact]
        public async Task GenerateAsync_HappyPath_BuildsPhasesMarksReadyAndNotifies()
        {
            var id = Guid.NewGuid();
            var roadmap = PendingRoadmap(id);
            _roadmaps.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(roadmap);
            _roadmaps.Setup(r => r.UpdateAsync(It.IsAny<Roadmap>())).Returns(Task.CompletedTask);
            _generator
                .Setup(g => g.GenerateAsync(It.IsAny<RoadmapGenerationRequest>()))
                .ReturnsAsync(
                    new GeneratedRoadmapDto
                    {
                        Title = "Plan kariery",
                        Phases = new List<GeneratedPhaseDto>
                        {
                            new()
                            {
                                Title = "Faza 1",
                                OrderIndex = 0,
                                StartMonth = 1,
                                EndMonth = 6,
                                Steps = new List<GeneratedStepDto>
                                {
                                    new()
                                    {
                                        TempId = "p1s1",
                                        Title = "C#",
                                        Subtitle = "Podstawy",
                                        Topics = new List<string> { "typy" },
                                        StepType = "required",
                                        OrderIndex = 0,
                                    },
                                },
                            },
                        },
                    }
                );

            await _sut.GenerateAsync(id, Request(), null!);

            roadmap.GenerationStatus.Should().Be(GenerationStatus.Ready);
            roadmap.Title.Should().Be("Plan kariery");
            roadmap.Phases.Should().ContainSingle();
            roadmap.Phases[0].Steps.Should().ContainSingle().Which.Title.Should().Be("C#");
            _notifications.Verify(
                n =>
                    n.CreateAsync(
                        UserId,
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        NotificationType.RoadmapGenerationCompleted,
                        id
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task GenerateAsync_WhenGeneratorFailsOnNonFinalAttempt_ResetsToPendingAndWraps()
        {
            var id = Guid.NewGuid();
            var roadmap = PendingRoadmap(id);
            _roadmaps.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(roadmap);
            _roadmaps.Setup(r => r.UpdateAsync(It.IsAny<Roadmap>())).Returns(Task.CompletedTask);
            _generator
                .Setup(g => g.GenerateAsync(It.IsAny<RoadmapGenerationRequest>()))
                .ThrowsAsync(new InvalidOperationException("openai down"));

            await _sut.Invoking(j => j.GenerateAsync(id, Request(), null!))
                .Should()
                .ThrowAsync<AiServiceException>();

            roadmap.GenerationStatus.Should().Be(GenerationStatus.Pending);
            _notifications.Verify(
                n =>
                    n.CreateAsync(
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        It.IsAny<string>(),
                        NotificationType.RoadmapGenerationFailed,
                        It.IsAny<Guid?>()
                    ),
                Times.Never
            );
        }
    }
}
