using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Controllers;
using VocareWebAPI.Models.Dtos.MarketAnalysis;
using VocareWebAPI.Repositories.Interfaces;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.CareerAdvisor.Controllers
{
    /// <summary>Testy jednostkowe <see cref="MarketAnalysisController"/>.</summary>
    public sealed class MarketAnalysisControllerTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IMarketAnalysisService> _service = new(MockBehavior.Strict);
        private readonly Mock<IBillingService> _billing = new(MockBehavior.Strict);
        private readonly MarketAnalysisController _sut;

        public MarketAnalysisControllerTests()
        {
            _sut = new MarketAnalysisController(_service.Object, _billing.Object);
            _sut.WithUser(UserId);
        }

        [Fact]
        public async Task GetMarketAnalysis_HappyPath_ChecksAccessGeneratesThenDeducts()
        {
            var response = new MarketAnalysisResponseDto();
            _billing
                .Setup(b => b.CanAccessServiceAsync(UserId, "MarketAnalysis"))
                .Returns(Task.CompletedTask);
            _service.Setup(s => s.GetMarketAnalysisAsync(UserId)).ReturnsAsync(response);
            _billing
                .Setup(b => b.DeductTokensForServiceAsync(UserId, "MarketAnalysis"))
                .Returns(Task.CompletedTask);

            var result = await _sut.GetMarketAnalysis();

            result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(response);
            _billing.Verify(
                b => b.DeductTokensForServiceAsync(UserId, "MarketAnalysis"),
                Times.Once
            );
        }

        [Fact]
        public async Task GetMarketAnalysis_WhenAccessDenied_DoesNotGenerateOrCharge()
        {
            _billing
                .Setup(b => b.CanAccessServiceAsync(UserId, "MarketAnalysis"))
                .ThrowsAsync(new InsufficientTokensException(UserId, 0, 50));

            await _sut.Invoking(c => c.GetMarketAnalysis())
                .Should()
                .ThrowAsync<InsufficientTokensException>();

            _service.VerifyNoOtherCalls();
            _billing.Verify(
                b => b.DeductTokensForServiceAsync(It.IsAny<string>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task GetMarketAnalysis_WithoutUserClaim_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.GetMarketAnalysis();

            result.Should().BeOfType<BadRequestObjectResult>();
            _billing.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task GetLatestMarketAnalysis_ReturnsServiceResultWithoutCharging()
        {
            var response = new MarketAnalysisResponseDto();
            _service.Setup(s => s.GetLatestMarketAnalysisAsync(UserId)).ReturnsAsync(response);

            var result = await _sut.GetLatestMarketAnalysis();

            result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(response);
            _billing.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task GetLatestMarketAnalysis_WithoutUserClaim_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.GetLatestMarketAnalysis();

            result.Should().BeOfType<BadRequestObjectResult>();
            _service.VerifyNoOtherCalls();
        }
    }
}
