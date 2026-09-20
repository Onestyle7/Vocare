using FluentAssertions;
using VocareWebAPI.JobOffers.Services.Implementations;
using Xunit;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>Testy jednostkowe czystego <see cref="ScoringService"/> – wagi, bonusy, progi ufności.</summary>
    public sealed class ScoringServiceTests
    {
        private readonly ScoringService _sut = new();

        [Fact]
        public void CalculateFinalScore_AppliesEqualWeightsToSemanticAndSkillScores()
        {
            // 0.4 * 50 + 0.4 * 50 = 40
            _sut.CalculateFinalScore(50, 50, categoryMatched: false, seniorityMatched: false)
                .Should()
                .Be(40);
        }

        [Fact]
        public void CalculateFinalScore_AddsCategoryAndSeniorityBonuses()
        {
            // 40 base + 10 + 10 = 60
            _sut.CalculateFinalScore(50, 50, categoryMatched: true, seniorityMatched: true)
                .Should()
                .Be(60);
        }

        [Fact]
        public void CalculateFinalScore_IsCappedAt100()
        {
            _sut.CalculateFinalScore(100, 100, categoryMatched: true, seniorityMatched: true)
                .Should()
                .Be(100);
        }

        [Theory]
        [InlineData(90, 4, "low")] // fewer than 5 offers always "low"
        [InlineData(90, 20, "high")]
        [InlineData(70, 20, "medium")]
        [InlineData(45, 20, "low")]
        [InlineData(20, 20, "very_low")]
        public void DetermineConfidenceLevel_MapsScoreAndVolumeToLabel(
            int score,
            int totalOffers,
            string expected
        )
        {
            _sut.DetermineConfidenceLevel(score, totalOffers).Should().Be(expected);
        }

        [Fact]
        public void GenerateDataQualityWarning_WarnsWhenTooFewOffers()
        {
            _sut.GenerateDataQualityWarning(90, 2).Should().Contain("Very few job offers");
        }

        [Fact]
        public void GenerateDataQualityWarning_WarnsWhenScoreIsLow()
        {
            _sut.GenerateDataQualityWarning(30, 10).Should().Contain("Low score");
        }

        [Fact]
        public void GenerateDataQualityWarning_ReturnsNullForHealthyResults()
        {
            _sut.GenerateDataQualityWarning(70, 10).Should().BeNull();
        }
    }
}
