using System;
using AutoMapper;
using FluentAssertions;
using VocareWebAPI.MarketNews.Models.Dtos;
using VocareWebAPI.MarketNews.Models.Entities;
using VocareWebAPI.MarketNews.Profiles;
using VocareWebApi.Tests.Common;
using Xunit;

namespace VocareWebApi.Tests.MarketNews
{
    /// <summary>Testy mapowań <see cref="MarketNewsProfile"/>.</summary>
    public sealed class MarketNewsProfileTests
    {
        private readonly IMapper _mapper = MapperFactory.Create(typeof(MarketNewsProfile));

        private static MarketNewsEntity Entity() =>
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Weekly buzz",
                Summary = "Short summary",
                Content = "Full article body",
                CreatedAt = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            };

        [Fact]
        public void Configuration_IsValid()
        {
            MapperFactory.AssertValid(typeof(MarketNewsProfile));
        }

        [Fact]
        public void Map_EntityToListDto_CopiesListFields()
        {
            var entity = Entity();

            var dto = _mapper.Map<MarketNewsListDto>(entity);

            dto.Id.Should().Be(entity.Id);
            dto.Title.Should().Be("Weekly buzz");
            dto.Summary.Should().Be("Short summary");
            dto.CreatedAt.Should().Be(entity.CreatedAt);
        }

        [Fact]
        public void Map_EntityToDetailDto_IncludesContent()
        {
            var dto = _mapper.Map<MarketNewsDetailDto>(Entity());

            dto.Content.Should().Be("Full article body");
        }
    }
}
