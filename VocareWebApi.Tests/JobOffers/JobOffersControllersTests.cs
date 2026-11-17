using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using VocareWebAPI.JobOffers.Controllers;
using VocareWebAPI.JobOffers.Models.Dtos;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Interfaces;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>Testy jednostkowe <see cref="CronController"/> – autoryzacja kluczem API.</summary>
    public sealed class CronControllerTests
    {
        private const string CronKey = "secret-cron-key";

        private readonly Mock<IJobOfferSyncService> _syncService = new(MockBehavior.Strict);
        private readonly CronController _sut;

        public CronControllerTests()
        {
            _sut = new CronController(
                _syncService.Object,
                TestConfiguration.FromValues(("CronJobsKey", CronKey))
            );
            _sut.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext(),
            };
        }

        [Fact]
        public async Task SyncOffers_WithoutApiKeyHeader_ReturnsUnauthorized()
        {
            var result = await _sut.SyncOffers();

            result.Should().BeOfType<UnauthorizedResult>();
            _syncService.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task SyncOffers_WithWrongApiKey_ReturnsUnauthorized()
        {
            _sut.ControllerContext.HttpContext.Request.Headers["X-Api-Key"] = "nope";

            var result = await _sut.SyncOffers();

            result.Should().BeOfType<UnauthorizedResult>();
        }

        [Fact]
        public async Task SyncOffers_WithValidApiKey_RunsSyncAndReturnsResult()
        {
            _sut.ControllerContext.HttpContext.Request.Headers["X-Api-Key"] = CronKey;
            var syncResult = new SyncResult { Added = 3, Total = 10 };
            _syncService
                .Setup(s => s.SyncOffersAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(syncResult);

            var result = await _sut.SyncOffers();

            result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(syncResult);
        }

        [Fact]
        public async Task CleanupStaleOffers_WithValidApiKey_DeactivatesPerSourceThenPurges()
        {
            _sut.ControllerContext.HttpContext.Request.Headers["X-Api-Key"] = CronKey;
            _syncService
                .Setup(s =>
                    s.CleanupStaleOffersAsync(It.IsAny<JobOfferSource>(), It.IsAny<CancellationToken>())
                )
                .ReturnsAsync(new CleanupResult { RemovedCount = 2 });
            _syncService.Setup(s => s.PurgeExpiredOffersAsync()).ReturnsAsync(5);

            var result = await _sut.CleanupStaleOffers();

            var value = result.Should().BeOfType<OkObjectResult>().Which.Value;
            value.Should().BeEquivalentTo(new { purged = 5 });
            _syncService.Verify(s => s.PurgeExpiredOffersAsync(), Times.Once);
            _syncService.Verify(
                s =>
                    s.CleanupStaleOffersAsync(It.IsAny<JobOfferSource>(), It.IsAny<CancellationToken>()),
                Times.Exactly(Enum.GetValues<JobOfferSource>().Length)
            );
        }

        [Fact]
        public async Task CleanupStaleOffers_WithoutApiKeyHeader_ReturnsUnauthorized()
        {
            var result = await _sut.CleanupStaleOffers();

            result.Should().BeOfType<UnauthorizedResult>();
            _syncService.VerifyNoOtherCalls();
        }
    }

    /// <summary>Testy jednostkowe <see cref="JobOffersController"/>.</summary>
    public sealed class JobOffersControllerTests
    {
        private const string UserId = "user-123";

        private readonly Mock<IJobOfferSyncService> _sync = new(MockBehavior.Strict);
        private readonly Mock<IJobOfferRepository> _repository = new(MockBehavior.Strict);
        private readonly Mock<IJobOfferMatchingService> _matching = new(MockBehavior.Strict);
        private readonly Mock<ISkillMatchingService> _skillMatching = new(MockBehavior.Strict);
        private readonly Mock<ISkillEmbeddingService> _skillEmbedding = new(MockBehavior.Strict);
        private readonly Mock<IJobOfferDetailsService> _details = new(MockBehavior.Strict);
        private readonly JobOffersController _sut;

        public JobOffersControllerTests()
        {
            _sut = new JobOffersController(
                _sync.Object,
                _repository.Object,
                _matching.Object,
                _skillMatching.Object,
                _skillEmbedding.Object,
                _details.Object
            );
            _sut.WithUser(UserId);
        }

        [Fact]
        public async Task GetCount_ReturnsCountPayload()
        {
            _repository.Setup(r => r.GetCountAsync()).ReturnsAsync(42);

            var result = await _sut.GetCount();

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("count")
                .Should()
                .Be(42);
        }

        [Fact]
        public async Task GetMatchingOffers_DelegatesToMatchingService()
        {
            var careerPathId = Guid.NewGuid();
            var offers = new List<JobOfferMatchDto>();
            _matching
                .Setup(m => m.GetMatchingOffersForCareerPathAsync(careerPathId, 5))
                .ReturnsAsync(offers);

            var result = await _sut.GetMatchingOffers(careerPathId);

            result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(offers);
        }

        [Fact]
        public async Task GetMatchingOffersForMyRecommendations_WithoutUser_ReturnsBadRequest()
        {
            _sut.WithoutUser();

            var result = await _sut.GetMatchingOffersForMyRecommendations();

            result.Result.Should().BeOfType<BadRequestObjectResult>();
            _matching.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task GetMatchingOffersForMyRecommendations_PassesUserIdAndLimit()
        {
            var offers = new Dictionary<Guid, List<JobOfferMatchDto>>();
            _matching.Setup(m => m.GetMatchingOffersForUserAsync(UserId, 7)).ReturnsAsync(offers);

            var result = await _sut.GetMatchingOffersForMyRecommendations(limitPerPath: 7);

            result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(offers);
        }

        [Fact]
        public async Task GetJobOfferDetails_DelegatesToDetailsService()
        {
            var id = Guid.NewGuid();
            var dto = new JobOfferDetailsDto { Id = id, Title = "Backend Developer" };
            _details.Setup(d => d.GetDetailsByIdAsync(id)).ReturnsAsync(dto);

            var result = await _sut.GetJobOfferDetails(id);

            result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(dto);
        }
    }
}
