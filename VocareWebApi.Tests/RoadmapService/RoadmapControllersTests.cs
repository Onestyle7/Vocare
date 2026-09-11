using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using VocareWebAPI.RoadmapService.Controllers;
using VocareWebAPI.RoadmapService.Exceptions;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;
using VocareWebAPI.RoadmapService.Services.Interfaces;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.RoadmapService
{
    /// <summary>Testy jednostkowe <see cref="RoadmapController"/>.</summary>
    public sealed class RoadmapControllerTests
    {
        private const string UserId = "user-123";

        private readonly Mock<ICareerRoadmapService> _service = new(MockBehavior.Strict);
        private readonly RoadmapController _sut;

        public RoadmapControllerTests()
        {
            _sut = new RoadmapController(_service.Object);
            _sut.WithUser(UserId);
        }

        [Fact]
        public async Task GenerateRoadmap_ReturnsAcceptedWithRoadmapId()
        {
            var roadmap = new Roadmap
            {
                Id = Guid.NewGuid(),
                GenerationStatus = GenerationStatus.Pending,
            };
            _service
                .Setup(s => s.GenerateRoadmapAsync(UserId, roadmap.Id, 12))
                .ReturnsAsync(roadmap);

            var result = await _sut.GenerateRoadmap(
                new GenerateRoadmapRequestDto { CareerPathId = roadmap.Id, TimeHorizonMonths = 12 }
            );

            result
                .Should()
                .BeOfType<AcceptedResult>()
                .Which.Value!.GetProperty("roadmapId")
                .Should()
                .Be(roadmap.Id);
        }

        [Fact]
        public async Task GenerateRoadmap_WithoutUser_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.GenerateRoadmap(new GenerateRoadmapRequestDto());

            result.Should().BeOfType<BadRequestObjectResult>();
            _service.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task GetRoadmapById_ReturnsMappedDtoWithProgress()
        {
            var id = Guid.NewGuid();
            _service
                .Setup(s => s.GetByIdAsync(id, UserId))
                .ReturnsAsync(
                    new Roadmap
                    {
                        Id = id,
                        Title = "Plan",
                        LifecycleStatus = LifecycleStatus.Active,
                        GenerationStatus = GenerationStatus.Ready,
                        Phases = new List<RoadmapPhase>(),
                    }
                );
            _service.Setup(s => s.CalculateProgressAsync(id, UserId)).ReturnsAsync(42.0);

            var result = await _sut.GetRoadmapById(id);

            var dto = result
                .Should()
                .BeOfType<OkObjectResult>()
                .Subject.Value.Should()
                .BeOfType<RoadmapResponseDto>()
                .Subject;
            dto.Title.Should().Be("Plan");
            dto.Progress.Should().Be(42.0);
        }

        [Fact]
        public async Task GetUserRoadmaps_ReturnsListItems()
        {
            _service
                .Setup(s => s.GetUserRoadmapsAsync(UserId))
                .ReturnsAsync(
                    new List<Roadmap>
                    {
                        new()
                        {
                            Id = Guid.NewGuid(),
                            Title = "R1",
                            LifecycleStatus = LifecycleStatus.Draft,
                            GenerationStatus = GenerationStatus.Ready,
                            Phases = new List<RoadmapPhase>(),
                        },
                    }
                );

            var result = await _sut.GetUserRoadmaps();

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value.Should()
                .BeAssignableTo<List<RoadmapListItemDto>>()
                .Which.Should()
                .ContainSingle();
        }

        [Fact]
        public async Task UpdateRoadmapStatus_ReturnsNoContent()
        {
            var id = Guid.NewGuid();
            _service
                .Setup(s => s.UpdateStatusAsync(id, UserId, LifecycleStatus.Completed))
                .Returns(Task.CompletedTask);

            var result = await _sut.UpdateRoadmapStatus(id, LifecycleStatus.Completed);

            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task ArchiveRoadmap_ReturnsNoContent()
        {
            var id = Guid.NewGuid();
            _service.Setup(s => s.ArchiveAsync(id, UserId)).Returns(Task.CompletedTask);

            var result = await _sut.ArchiveRoadmap(id);

            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task GetRoadmapProgress_ReturnsProgressPayload()
        {
            var id = Guid.NewGuid();
            _service.Setup(s => s.CalculateProgressAsync(id, UserId)).ReturnsAsync(75.0);

            var result = await _sut.GetRoadmapProgress(id);

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("Progress")
                .Should()
                .Be(75.0);
        }

        [Fact]
        public async Task RetryGeneration_ReturnsAccepted()
        {
            var id = Guid.NewGuid();
            _service
                .Setup(s => s.RetryGenerationAsync(id, UserId))
                .ReturnsAsync(new Roadmap { Id = id, GenerationStatus = GenerationStatus.Pending });

            var result = await _sut.RetryGeneration(id);

            result.Should().BeOfType<AcceptedResult>();
        }
    }

    /// <summary>Testy jednostkowe <see cref="RoadmapPhasesController"/>.</summary>
    public sealed class RoadmapPhasesControllerTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IRoadmapPhaseService> _service = new(MockBehavior.Strict);
        private readonly RoadmapPhasesController _sut;

        public RoadmapPhasesControllerTests()
        {
            _sut = new RoadmapPhasesController(_service.Object);
            _sut.WithUser(UserId);
        }

        [Fact]
        public async Task UpdateName_ReturnsMappedPhase()
        {
            var phaseId = Guid.NewGuid();
            _service
                .Setup(s => s.UpdateNameAsync(phaseId, UserId, "Renamed"))
                .ReturnsAsync(
                    new RoadmapPhase
                    {
                        Id = phaseId,
                        Title = "Renamed",
                        Steps = new List<RoadmapStep>(),
                    }
                );

            var result = await _sut.UpdateName(phaseId, "Renamed");

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value.Should()
                .BeOfType<RoadmapPhaseResponseDto>()
                .Which.Title.Should()
                .Be("Renamed");
        }

        [Fact]
        public async Task DeletePhase_ReturnsNoContent()
        {
            var phaseId = Guid.NewGuid();
            _service.Setup(s => s.DeletePhaseAsync(phaseId, UserId)).Returns(Task.CompletedTask);

            var result = await _sut.DeletePhase(phaseId);

            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task UpdateName_WithoutUser_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.UpdateName(Guid.NewGuid(), "x");

            result.Should().BeOfType<BadRequestObjectResult>();
            _service.VerifyNoOtherCalls();
        }
    }

    /// <summary>Testy jednostkowe <see cref="RoadmapStepsController"/>.</summary>
    public sealed class RoadmapStepsControllerTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IRoadmapStepService> _service = new(MockBehavior.Strict);
        private readonly RoadmapStepsController _sut;

        public RoadmapStepsControllerTests()
        {
            _sut = new RoadmapStepsController(_service.Object);
            _sut.WithUser(UserId);
        }

        private static RoadmapStep Step(Guid id) =>
            new()
            {
                Id = id,
                Title = "Step",
                Subtitle = "sub",
                Topics = new List<string>(),
            };

        [Fact]
        public async Task ChangeStatus_ReturnsMappedStep()
        {
            var stepId = Guid.NewGuid();
            _service
                .Setup(s => s.ChangeStatusAsync(stepId, UserId, StepStatus.Completed))
                .ReturnsAsync(Step(stepId));

            var result = await _sut.ChangeStatus(stepId, StepStatus.Completed);

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value.Should()
                .BeOfType<RoadmapStepResponseDto>()
                .Which.Id.Should()
                .Be(stepId);
        }

        [Fact]
        public async Task AddStep_ForwardsDtoFieldsToService()
        {
            var phaseId = Guid.NewGuid();
            var createdId = Guid.NewGuid();
            _service
                .Setup(s =>
                    s.AddStepAsync(
                        phaseId,
                        UserId,
                        null,
                        "Title",
                        "Sub",
                        "Desc",
                        It.IsAny<List<string>>(),
                        StepType.Optional
                    )
                )
                .ReturnsAsync(Step(createdId));

            var result = await _sut.AddStep(
                new AddStepRequestDto
                {
                    PhaseId = phaseId,
                    Title = "Title",
                    Subtitle = "Sub",
                    Description = "Desc",
                    Topics = new List<string> { "t" },
                    StepType = StepType.Optional,
                }
            );

            result.Should().BeOfType<OkObjectResult>();
            _service.Verify(
                s =>
                    s.AddStepAsync(
                        phaseId,
                        UserId,
                        null,
                        "Title",
                        "Sub",
                        "Desc",
                        It.IsAny<List<string>>(),
                        StepType.Optional
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task DeleteStep_ReturnsNoContent()
        {
            var stepId = Guid.NewGuid();
            _service.Setup(s => s.DeleteStepAsync(stepId, UserId)).Returns(Task.CompletedTask);

            var result = await _sut.DeleteStep(stepId);

            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task UpdateStepPositions_MapsRequestToDictionaryAndReturnsNoContent()
        {
            var stepId = Guid.NewGuid();
            _service
                .Setup(s =>
                    s.UpdateStepPositionAsync(
                        UserId,
                        It.Is<Dictionary<Guid, (double x, double y)>>(d =>
                            d.ContainsKey(stepId) && d[stepId].x == 1.0 && d[stepId].y == 2.0
                        )
                    )
                )
                .Returns(Task.CompletedTask);

            var result = await _sut.UpdateStepPositions(
                new UpdatePositionsRequestDto
                {
                    Positions = new List<StepPositionDto>
                    {
                        new()
                        {
                            StepId = stepId,
                            X = 1.0,
                            Y = 2.0,
                        },
                    },
                }
            );

            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task ChangeStatus_WithoutUser_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.ChangeStatus(Guid.NewGuid(), StepStatus.Completed);

            result.Should().BeOfType<BadRequestObjectResult>();
            _service.VerifyNoOtherCalls();
        }
    }
}
