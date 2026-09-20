using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using VocareWebAPI.MarketNews.Controllers;
using VocareWebAPI.MarketNews.Models.Dtos;
using VocareWebAPI.MarketNews.Services.Interfaces;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.MarketNews
{
    /// <summary>Testy jednostkowe <see cref="MarketNewsController"/>.</summary>
    public sealed class MarketNewsControllerTests
    {
        private readonly Mock<IMarketNewsService> _service = new(MockBehavior.Strict);
        private readonly MarketNewsController _sut;

        public MarketNewsControllerTests()
        {
            _sut = new MarketNewsController(
                _service.Object,
                NullLogger<MarketNewsController>.Instance
            );
            _sut.WithUser("user-123");
        }

        [Fact]
        public async Task GetLatest3News_ReturnsOkWithList()
        {
            var list = new List<MarketNewsListDto> { new() { Title = "A" } };
            _service.Setup(s => s.GetLatest3ForHomepageAsync()).ReturnsAsync(list);

            var result = await _sut.GetLatest3News();

            result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(list);
        }

        [Fact]
        public async Task GetLatestForPopup_WhenNoNews_ReturnsNotFound()
        {
            _service.Setup(s => s.GetLatestForPopupAsync()).ReturnsAsync((MarketNewsListDto?)null);

            var result = await _sut.GetLatestForPopup();

            result.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Fact]
        public async Task GetLatestForPopup_WhenNewsExists_ReturnsOk()
        {
            var dto = new MarketNewsListDto { Title = "Latest" };
            _service.Setup(s => s.GetLatestForPopupAsync()).ReturnsAsync(dto);

            var result = await _sut.GetLatestForPopup();

            result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(dto);
        }

        [Theory]
        [InlineData(0, 10)]
        [InlineData(1, 0)]
        [InlineData(-1, -1)]
        public async Task GetAllForBlog_WithInvalidPaging_ReturnsBadRequest(int page, int pageSize)
        {
            var result = await _sut.GetAllForBlog(page, pageSize);

            result.Result.Should().BeOfType<BadRequestObjectResult>();
            _service.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task GetAllForBlog_WithValidPaging_ReturnsOk()
        {
            var paged = new MarketNewsPagedDto { Page = 1, PageSize = 10 };
            _service.Setup(s => s.GetAllForBlogAsync(1, 10)).ReturnsAsync(paged);

            var result = await _sut.GetAllForBlog();

            result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(paged);
        }

        [Fact]
        public async Task GetNewsDetail_WhenMissing_ReturnsNotFound()
        {
            _service
                .Setup(s => s.GetDetailAsync(It.IsAny<Guid>()))
                .ReturnsAsync((MarketNewsDetailDto?)null);

            var result = await _sut.GetNewsDetail(Guid.NewGuid());

            result.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Fact]
        public async Task GenerateNewsManually_WhenAlreadyExists_ReturnsConflict()
        {
            _service.Setup(s => s.GenerateNewsManuallyAsync()).ReturnsAsync(false);

            var result = await _sut.GenerateNewsManually(force: false);

            result.Should().BeOfType<ConflictObjectResult>();
        }

        [Fact]
        public async Task GenerateNewsManually_WhenGenerated_ReturnsOk()
        {
            _service.Setup(s => s.GenerateNewsManuallyAsync()).ReturnsAsync(true);

            var result = await _sut.GenerateNewsManually(force: false);

            result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task GenerateNewsManually_WhenForced_ReturnsGeneratedId()
        {
            var newsId = Guid.NewGuid();
            _service.Setup(s => s.GenerateNewsForcedAsync()).ReturnsAsync(newsId);

            var result = await _sut.GenerateNewsManually(force: true);

            result
                .Should()
                .BeOfType<OkObjectResult>()
                .Which.Value!.GetProperty("NewsId")
                .Should()
                .Be(newsId);
        }

        [Fact]
        public async Task GenerateNewsManually_WhenServiceThrows_Returns500()
        {
            _service
                .Setup(s => s.GenerateNewsManuallyAsync())
                .ThrowsAsync(new InvalidOperationException("AI down"));

            var result = await _sut.GenerateNewsManually(force: false);

            result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
        }
    }
}
