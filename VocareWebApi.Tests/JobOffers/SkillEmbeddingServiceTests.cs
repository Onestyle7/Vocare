using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Pgvector;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Implementations;
using VocareWebAPI.Shared.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>
    /// Testy jednostkowe <see cref="SkillEmbeddingService"/> – normalizacja nazw oraz cache
    /// osadzeń umiejętności (odczyt z repozytorium + dogenerowanie brakujących).
    /// </summary>
    public sealed class SkillEmbeddingServiceTests
    {
        private readonly Mock<ISkillEmbeddingRepository> _repository = new();
        private readonly Mock<IEmbeddingService> _embeddingService = new();
        private readonly Mock<IJobOfferRepository> _jobOffers = new();
        private readonly SkillEmbeddingService _sut;

        public SkillEmbeddingServiceTests()
        {
            _sut = new SkillEmbeddingService(
                _repository.Object,
                NullLogger<SkillEmbeddingService>.Instance,
                _embeddingService.Object,
                _jobOffers.Object
            );
        }

        [Theory]
        [InlineData("  C# ", "c#")]
        [InlineData("SQL", "sql")]
        public void NormalizeSkillName_TrimsAndLowercases(string input, string expected)
        {
            _sut.NormalizeSkillName(input).Should().Be(expected);
        }

        [Fact]
        public async Task GetEmbeddingsForSkillsAsync_WithEmptyList_ReturnsEmptyDictionary()
        {
            (await _sut.GetEmbeddingsForSkillsAsync(new List<string>())).Should().BeEmpty();
        }

        [Fact]
        public async Task GetEmbeddingsForSkillsAsync_UsesCacheAndGeneratesOnlyMissing()
        {
            _repository
                .Setup(r => r.GetByNormalizedNamesAsync(It.IsAny<List<string>>()))
                .ReturnsAsync(
                    new List<SkillEmbedding>
                    {
                        new()
                        {
                            NormalizedSkillName = "c#",
                            Embedding = new Vector(new float[] { 1f, 0f }),
                        },
                    }
                );
            _embeddingService
                .Setup(e => e.GenerateEmbeddingAsync("sql"))
                .ReturnsAsync(new Vector(new float[] { 0f, 1f }));
            _repository
                .Setup(r => r.AddRangeAsync(It.IsAny<List<SkillEmbedding>>()))
                .Returns(Task.CompletedTask);

            var result = await _sut.GetEmbeddingsForSkillsAsync(new List<string> { "C#", "SQL" });

            result.Should().ContainKeys("C#", "SQL");
            result["C#"].Should().Equal(1f, 0f);
            result["SQL"].Should().Equal(0f, 1f);
            _embeddingService.Verify(e => e.GenerateEmbeddingAsync("sql"), Times.Once);
            _embeddingService.Verify(e => e.GenerateEmbeddingAsync("c#"), Times.Never);
            _repository.Verify(
                r => r.AddRangeAsync(It.Is<List<SkillEmbedding>>(l => l.Count == 1)),
                Times.Once
            );
        }
    }
}
