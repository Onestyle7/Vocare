using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.CvGenerator.Controllers;
using VocareWebAPI.CvGenerator.Interfaces;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Shared.Results;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.CvGenerator.Controllers
{
    /// <summary>Testy jednostkowe <see cref="CvController"/>.</summary>
    public sealed class CvControllerTests
    {
        private const string UserId = "user-123";

        private readonly Mock<ICvManagementService> _management = new(MockBehavior.Strict);
        private readonly Mock<ICvAnalysisService> _analysis = new(MockBehavior.Strict);
        private readonly Mock<ICvTailoringService> _tailoring = new(MockBehavior.Strict);
        private readonly Mock<IBillingService> _billing = new(MockBehavior.Strict);
        private readonly CvController _sut;

        public CvControllerTests()
        {
            _sut = new CvController(
                _management.Object,
                _analysis.Object,
                _tailoring.Object,
                _billing.Object
            );
            _sut.WithUser(UserId);
        }

        [Fact]
        public async Task GetUserCvs_WithoutUser_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.GetUserCvs();

            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task GetUserCvs_ReturnsList()
        {
            var list = new List<CvListItemDto> { new() { Name = "CV" } };
            _management.Setup(m => m.GetUserCvsAsync(UserId)).ReturnsAsync(list);

            var result = await _sut.GetUserCvs();

            result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(list);
        }

        [Fact]
        public async Task GetCvDetails_ReturnsDetails()
        {
            var details = new CvDetailsDto { Id = Guid.NewGuid() };
            _management.Setup(m => m.GetCvDetailsAsync(details.Id, UserId)).ReturnsAsync(details);

            var result = await _sut.GetCvDetails(details.Id);

            result
                .Result.Should()
                .BeOfType<OkObjectResult>()
                .Which.Value.Should()
                .BeSameAs(details);
        }

        [Fact]
        public async Task CreateCv_WhenServiceReturnsFailure_ReturnsProblemDetails()
        {
            _management
                .Setup(m => m.CreateCvAsync(UserId, It.IsAny<CreateCvDto>()))
                .ReturnsAsync(
                    Result<CvDetailsDto>.Fail(new Error("CV_LIMIT_REACHED", "limit", 422))
                );

            var result = await _sut.CreateCv(new CreateCvDto { Name = "CV" });

            var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
            objectResult.StatusCode.Should().Be(422);
        }

        [Fact]
        public async Task CreateCv_WhenSuccessful_ReturnsCreatedAtAction()
        {
            var details = new CvDetailsDto { Id = Guid.NewGuid() };
            _management
                .Setup(m => m.CreateCvAsync(UserId, It.IsAny<CreateCvDto>()))
                .ReturnsAsync(Result<CvDetailsDto>.Ok(details));

            var result = await _sut.CreateCv(new CreateCvDto { Name = "CV" });

            result
                .Result.Should()
                .BeOfType<CreatedAtActionResult>()
                .Which.Value.Should()
                .BeSameAs(details);
        }

        [Fact]
        public async Task UpdateCv_WhenUrlIdDiffersFromBody_ReturnsBadRequest()
        {
            var result = await _sut.UpdateCv(
                Guid.NewGuid(),
                new UpdateCvDto { Id = Guid.NewGuid(), Name = "CV" }
            );

            result.Result.Should().BeOfType<BadRequestObjectResult>();
            _management.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task UpdateCv_WhenValid_ReturnsOk()
        {
            var id = Guid.NewGuid();
            var details = new CvDetailsDto { Id = id };
            _management
                .Setup(m => m.UpdateCvAsync(UserId, It.IsAny<UpdateCvDto>()))
                .ReturnsAsync(details);

            var result = await _sut.UpdateCv(id, new UpdateCvDto { Id = id, Name = "CV" });

            result
                .Result.Should()
                .BeOfType<OkObjectResult>()
                .Which.Value.Should()
                .BeSameAs(details);
        }

        [Fact]
        public async Task DeleteCv_ReturnsNoContent()
        {
            var id = Guid.NewGuid();
            _management.Setup(m => m.DeleteCvAsync(id, UserId)).Returns(Task.CompletedTask);

            var result = await _sut.DeleteCv(id);

            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task SetDefaultCv_ReturnsNoContent()
        {
            var id = Guid.NewGuid();
            _management.Setup(m => m.SetDefaultCvAsync(UserId, id)).Returns(Task.CompletedTask);

            var result = await _sut.SetDefaultCv(id);

            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task GetCvLimits_ReturnsCountsAndLimit()
        {
            _management.Setup(m => m.CanCreateNewCvAsync(UserId)).ReturnsAsync(true);
            _management.Setup(m => m.GetMaxCvLimitAsync(UserId)).ReturnsAsync(3);
            _management
                .Setup(m => m.GetUserCvsAsync(UserId))
                .ReturnsAsync(new List<CvListItemDto> { new(), new() });

            var result = await _sut.GetCvLimits();

            var value = result.Should().BeOfType<OkObjectResult>().Subject.Value!;
            value.GetProperty("canCreateNew").Should().Be(true);
            value.GetProperty("currentCount").Should().Be(2);
            value.GetProperty("maxLimit").Should().Be(3);
        }

        [Fact]
        public async Task AnalyzeCvAsync_HappyPath_ChecksAccessAnalyzesThenDeducts()
        {
            var cvId = Guid.NewGuid();
            var dto = new CvAnalysisResultDto { OverallScore = 80 };
            _billing
                .Setup(b => b.CanAccessServiceAsync(UserId, "AnalyzeCv"))
                .Returns(Task.CompletedTask);
            _analysis.Setup(a => a.AnalyzeCvAsync(cvId, UserId)).ReturnsAsync(dto);
            _billing
                .Setup(b => b.DeductTokensForServiceAsync(UserId, "AnalyzeCv"))
                .Returns(Task.CompletedTask);

            var result = await _sut.AnalyzeCvAsync(cvId);

            result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(dto);
            _billing.Verify(b => b.DeductTokensForServiceAsync(UserId, "AnalyzeCv"), Times.Once);
        }

        [Fact]
        public async Task GetAnalysisAsync_ReturnsStoredAnalysis()
        {
            var cvId = Guid.NewGuid();
            var dto = new CvAnalysisResultDto { OverallScore = 90 };
            _analysis.Setup(a => a.GetAnalysisAsync(cvId, UserId)).ReturnsAsync(dto);

            var result = await _sut.GetAnalysisAsync(cvId);

            result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(dto);
        }

        [Fact]
        public async Task TailorCvAsync_HappyPath_ChecksAccessTailorsThenDeducts()
        {
            var dto = new TailorCvDto { CvId = Guid.NewGuid(), JobDescription = "role" };
            var details = new CvDetailsDto { Id = dto.CvId };
            _billing
                .Setup(b => b.CanAccessServiceAsync(UserId, "TailorCv"))
                .Returns(Task.CompletedTask);
            _tailoring.Setup(t => t.TailorCvAsync(dto, UserId)).ReturnsAsync(details);
            _billing
                .Setup(b => b.DeductTokensForServiceAsync(UserId, "TailorCv"))
                .Returns(Task.CompletedTask);

            var result = await _sut.TailorCvAsync(dto);

            result
                .Result.Should()
                .BeOfType<OkObjectResult>()
                .Which.Value.Should()
                .BeSameAs(details);
        }

        [Fact]
        public async Task GenerateCvFromProfileAsync_WhenServiceFails_DoesNotDeductTokens()
        {
            _billing
                .Setup(b => b.CanAccessServiceAsync(UserId, "GenerateCvFromProfile"))
                .Returns(Task.CompletedTask);
            _tailoring
                .Setup(t =>
                    t.GenerateCvFromProfileAsync(It.IsAny<GenerateCvFromProfileDto>(), UserId)
                )
                .ReturnsAsync(
                    Result<CvDetailsDto>.Fail(new Error("CV_LIMIT_REACHED", "limit", 422))
                );

            var result = await _sut.GenerateCvFromProfileAsync(
                new GenerateCvFromProfileDto { JobDescription = "role" }
            );

            result.Result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(422);
            _billing.Verify(
                b => b.DeductTokensForServiceAsync(UserId, "GenerateCvFromProfile"),
                Times.Never
            );
        }

        [Fact]
        public async Task GenerateCvFromProfileAsync_WhenSuccessful_DeductsTokensAndReturnsOk()
        {
            var details = new CvDetailsDto { Id = Guid.NewGuid() };
            _billing
                .Setup(b => b.CanAccessServiceAsync(UserId, "GenerateCvFromProfile"))
                .Returns(Task.CompletedTask);
            _tailoring
                .Setup(t =>
                    t.GenerateCvFromProfileAsync(It.IsAny<GenerateCvFromProfileDto>(), UserId)
                )
                .ReturnsAsync(Result<CvDetailsDto>.Ok(details));
            _billing
                .Setup(b => b.DeductTokensForServiceAsync(UserId, "GenerateCvFromProfile"))
                .Returns(Task.CompletedTask);

            var result = await _sut.GenerateCvFromProfileAsync(
                new GenerateCvFromProfileDto { JobDescription = "role" }
            );

            result
                .Result.Should()
                .BeOfType<OkObjectResult>()
                .Which.Value.Should()
                .BeSameAs(details);
            _billing.Verify(
                b => b.DeductTokensForServiceAsync(UserId, "GenerateCvFromProfile"),
                Times.Once
            );
        }
    }
}
