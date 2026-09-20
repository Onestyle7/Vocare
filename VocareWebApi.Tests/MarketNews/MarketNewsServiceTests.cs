using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using VocareWebAPI.CareerAdvisor.Models.Config;
using VocareWebAPI.MarketNews.Models.Entities;
using VocareWebAPI.MarketNews.Profiles;
using VocareWebAPI.MarketNews.Repositories.Interfaces;
using VocareWebAPI.MarketNews.Services.Implementations;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.MarketNews
{
    /// <summary>
    /// Testy jednostkowe metod odczytu <see cref="MarketNewsService"/> oraz zabezpieczenia
    /// przed duplikatem przy ręcznym generowaniu.
    /// </summary>
    public sealed class MarketNewsServiceTests
    {
        private readonly Mock<IMarketNewsRepository> _repository = new(MockBehavior.Strict);
        private readonly MarketNewsService _sut;

        public MarketNewsServiceTests()
        {
            _sut = new MarketNewsService(
                _repository.Object,
                NullLogger<MarketNewsService>.Instance,
                new HttpClient(
                    FakeHttpMessageHandler.Throwing(
                        new InvalidOperationException("no network in tests")
                    )
                ),
                MapperFactory.Create(typeof(MarketNewsProfile)),
                Options.Create(new PerplexityAIConfig { BaseUrl = "https://api.perplexity.ai" })
            );
        }

        private static MarketNewsEntity News(
            string title = "Weekly buzz",
            DateTime? createdAt = null
        ) =>
            new()
            {
                Id = Guid.NewGuid(),
                Title = title,
                Summary = "summary",
                Content = "content",
                CreatedAt = createdAt ?? DateTime.UtcNow,
            };

        [Fact]
        public async Task GetLatest3ForHomepageAsync_MapsEntitiesToListDtos()
        {
            _repository
                .Setup(r => r.GetLatest3Async())
                .ReturnsAsync(new List<MarketNewsEntity> { News("A"), News("B") });

            var result = await _sut.GetLatest3ForHomepageAsync();

            result.Should().HaveCount(2);
            result[0].Title.Should().Be("A");
        }

        [Fact]
        public async Task GetLatestForPopupAsync_WhenNoNews_ReturnsNull()
        {
            _repository.Setup(r => r.GetLatestAsync()).ReturnsAsync((MarketNewsEntity?)null);

            (await _sut.GetLatestForPopupAsync()).Should().BeNull();
        }

        [Fact]
        public async Task GetLatestForPopupAsync_WhenNewsExists_MapsToListDto()
        {
            _repository.Setup(r => r.GetLatestAsync()).ReturnsAsync(News("Latest"));

            (await _sut.GetLatestForPopupAsync())!.Title.Should().Be("Latest");
        }

        [Fact]
        public async Task GetAllForBlogAsync_BuildsPagedDto()
        {
            _repository
                .Setup(r => r.GetAllPagedAsync(2, 5))
                .ReturnsAsync((new List<MarketNewsEntity> { News() }, 11));

            var result = await _sut.GetAllForBlogAsync(2, 5);

            result.Page.Should().Be(2);
            result.PageSize.Should().Be(5);
            result.TotalCount.Should().Be(11);
            result.TotalPages.Should().Be(3);
            result.News.Should().ContainSingle();
        }

        [Fact]
        public async Task GetDetailAsync_WhenMissing_ReturnsNull()
        {
            _repository
                .Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((MarketNewsEntity?)null);

            (await _sut.GetDetailAsync(Guid.NewGuid())).Should().BeNull();
        }

        [Fact]
        public async Task GetDetailAsync_WhenFound_MapsToDetailDto()
        {
            var entity = News("Detail");
            _repository.Setup(r => r.GetByIdAsync(entity.Id)).ReturnsAsync(entity);

            var result = await _sut.GetDetailAsync(entity.Id);

            result!.Title.Should().Be("Detail");
            result.Content.Should().Be("content");
        }

        [Fact]
        public async Task GenerateNewsManuallyAsync_WhenNewsForTodayExists_ReturnsFalse()
        {
            _repository.Setup(r => r.ExistsForDateAsync(It.IsAny<DateTime>())).ReturnsAsync(true);

            (await _sut.GenerateNewsManuallyAsync()).Should().BeFalse();
            _repository.Verify(r => r.AddAsync(It.IsAny<MarketNewsEntity>()), Times.Never);
        }
    }
}
