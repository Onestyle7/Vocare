using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using VocareWebAPI.JobOffers.Services.Implementations;
using VocareWebAPI.JobOffers.Services.Interfaces;
using Xunit;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>
    /// Testy jednostkowe <see cref="SkillMatchingService"/> – dopasowanie umiejętności metodą
    /// podobieństwa kosinusowego osadzeń.
    /// </summary>
    public sealed class SkillMatchingServiceTests
    {
        private readonly Mock<ISkillEmbeddingService> _embeddings = new();
        private readonly SkillMatchingService _sut;

        public SkillMatchingServiceTests()
        {
            _sut = new SkillMatchingService(
                _embeddings.Object,
                NullLogger<SkillMatchingService>.Instance
            );
        }

        [Fact]
        public async Task CalculateSkillMatchAsync_WithNoRequiredSkills_ReturnsPerfectScore()
        {
            var result = await _sut.CalculateSkillMatchAsync(
                new List<string>(),
                new List<string> { "C#" }
            );

            result.Score.Should().Be(100);
            result.TotalRequired.Should().Be(0);
        }

        [Fact]
        public async Task CalculateSkillMatchAsync_WithNoOfferSkills_ReturnsZeroAndListsAllAsMissing()
        {
            var result = await _sut.CalculateSkillMatchAsync(
                new List<string> { "C#", "SQL" },
                new List<string>()
            );

            result.Score.Should().Be(0);
            result.MissingSkills.Should().BeEquivalentTo(new[] { "C#", "SQL" });
        }

        [Fact]
        public async Task CalculateSkillMatchAsync_ClassifiesFullPartialAndMissingMatches()
        {
            var required = new List<string> { "csharp", "sql", "rust" };
            var offer = new List<string> { "csharp", "sqlserver", "cobol" };

            // Orthonormal axes: csharp=x, sql=y, rust=z, plus a 4th "noise" axis.
            _embeddings
                .Setup(e => e.GetEmbeddingsForSkillsAsync(required))
                .ReturnsAsync(
                    new Dictionary<string, float[]>
                    {
                        ["csharp"] = new[] { 1f, 0f, 0f, 0f },
                        ["sql"] = new[] { 0f, 1f, 0f, 0f },
                        ["rust"] = new[] { 0f, 0f, 1f, 0f },
                    }
                );
            _embeddings
                .Setup(e => e.GetEmbeddingsForSkillsAsync(offer))
                .ReturnsAsync(
                    new Dictionary<string, float[]>
                    {
                        ["csharp"] = new[] { 1f, 0f, 0f, 0f }, // identical -> full match
                        ["sqlserver"] = new[] { 0f, 0.7f, 0f, 0.714f }, // ~0.7 vs sql -> partial
                        ["cobol"] = new[] { 0f, 0f, 0f, 1f }, // nothing to match rust
                    }
                );

            var result = await _sut.CalculateSkillMatchAsync(required, offer);

            result.FullMatches.Should().ContainKey("csharp");
            result.PartialMatches.Should().ContainKey("sql");
            result.MissingSkills.Should().Contain("rust");
            result.MatchedCount.Should().Be(2);
        }
    }
}
