using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Controllers;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;
using VocareWebAPI.Services;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.CareerAdvisor.Controllers
{
    /// <summary>
    /// Testy jednostkowe <see cref="AiController"/> – kolejność wywołań (sprawdzenie dostępu →
    /// generacja → pobranie opłaty) oraz walidacja tokenu użytkownika.
    /// </summary>
    public sealed class AiControllerTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IAiService> _aiService = new(MockBehavior.Strict);
        private readonly Mock<IUserProfileRepository> _profiles = new(MockBehavior.Strict);
        private readonly Mock<IBillingService> _billing = new(MockBehavior.Strict);
        private readonly AiController _sut;

        public AiControllerTests()
        {
            _sut = new AiController(_aiService.Object, _profiles.Object, _billing.Object);
            _sut.WithUser(UserId);
        }

        [Fact]
        public async Task GetRecommendations_WithoutUserClaim_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.GetRecommendations();

            result.Should().BeOfType<BadRequestObjectResult>();
            _billing.VerifyNoOtherCalls();
            _aiService.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task GetRecommendations_HappyPath_ChecksAccessGeneratesThenDeductsTokens()
        {
            var profile = new UserProfile { UserId = UserId };
            var response = new AiCareerResponseDto();
            var sequence = new MockSequence();

            _billing
                .InSequence(sequence)
                .Setup(b => b.CanAccessServiceAsync(UserId, "AnalyzeProfile"))
                .Returns(Task.CompletedTask);
            _profiles
                .InSequence(sequence)
                .Setup(p => p.GetUserProfileByIdAsync(UserId))
                .ReturnsAsync(profile);
            _aiService
                .InSequence(sequence)
                .Setup(a => a.GetCareerRecommendationsAsync(profile))
                .ReturnsAsync(response);
            _billing
                .InSequence(sequence)
                .Setup(b => b.DeductTokensForServiceAsync(UserId, "AnalyzeProfile"))
                .Returns(Task.CompletedTask);

            var result = await _sut.GetRecommendations();

            result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(response);
            _billing.Verify(
                b => b.DeductTokensForServiceAsync(UserId, "AnalyzeProfile"),
                Times.Once
            );
        }

        [Fact]
        public async Task GetRecommendations_WhenAccessDenied_DoesNotGenerateOrCharge()
        {
            _billing
                .Setup(b => b.CanAccessServiceAsync(UserId, "AnalyzeProfile"))
                .ThrowsAsync(new InsufficientTokensException(UserId, 0, 60));

            await _sut.Invoking(c => c.GetRecommendations())
                .Should()
                .ThrowAsync<InsufficientTokensException>();

            _profiles.VerifyNoOtherCalls();
            _aiService.VerifyNoOtherCalls();
            _billing.Verify(
                b => b.DeductTokensForServiceAsync(It.IsAny<string>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public async Task GetLastRecommendation_ReturnsServiceResult()
        {
            var response = new AiCareerResponseDto();
            _aiService.Setup(a => a.GetLastRecommendationAsync(UserId)).ReturnsAsync(response);

            var result = await _sut.GetLastRecommendation();

            result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(response);
        }

        [Fact]
        public async Task GetLastRecommendation_WithoutUserClaim_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.GetLastRecommendation();

            result.Should().BeOfType<BadRequestObjectResult>();
            _aiService.VerifyNoOtherCalls();
        }
    }
}
