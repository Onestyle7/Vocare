using System.Collections.Generic;
using FluentAssertions;
using VocareWebAPI.JobOffers.Models.Dtos;
using VocareWebAPI.JobOffers.Models.Entities;
using Xunit;

namespace VocareWebApi.Tests.JobOffers
{
    /// <summary>
    /// Testy jednostkowe <see cref="JobOfferDtoMappingExtensions"/> – lokalizacje do wyświetlenia
    /// i podgląd opisu oferty.
    /// </summary>
    public sealed class JobOfferDtoMappingExtensionsTests
    {
        [Fact]
        public void ToDisplayLocations_NoFluffJobsStyle_KeepsCityAndSingleRemote()
        {
            var locations = new List<JobOfferLocation>
            {
                new() { City = "", IsRemote = true },
                new() { City = "Warszawa", IsRemote = false },
            };

            locations.ToDisplayLocations().Should().Equal("Warszawa", "Remote");
        }

        [Fact]
        public void ToDisplayLocations_SolidJobsRemoteStyle_KeepsCitiesAndAddsRemoteOnce()
        {
            var locations = new List<JobOfferLocation>
            {
                new() { City = "Warszawa", IsRemote = true },
                new() { City = "Kraków", IsRemote = true },
            };

            locations.ToDisplayLocations().Should().Equal("Warszawa", "Kraków", "Remote");
        }

        [Fact]
        public void ToDisplayLocations_RemovesDuplicateAndEmptyCities()
        {
            var locations = new List<JobOfferLocation>
            {
                new() { City = "Warszawa", IsRemote = false },
                new() { City = " warszawa ", IsRemote = false },
                new() { City = "  ", IsRemote = false },
            };

            locations.ToDisplayLocations().Should().Equal("Warszawa");
        }

        [Fact]
        public void ToDisplayLocations_WhenNull_ReturnsEmptyList()
        {
            ((IEnumerable<JobOfferLocation>?)null).ToDisplayLocations().Should().BeEmpty();
        }

        [Theory]
        [InlineData(null, "")]
        [InlineData("", "")]
        [InlineData("<p>Krótki opis</p>", "<p>Krótki opis</p>")]
        public void ToDescriptionPreview_WhenShort_ReturnsAsIs(string? description, string expected)
        {
            description.ToDescriptionPreview().Should().Be(expected);
        }

        [Fact]
        public void ToDescriptionPreview_WhenLong_TruncatesToMaxLength()
        {
            var description = new string('a', 5000);

            description
                .ToDescriptionPreview()
                .Should()
                .HaveLength(JobOfferDtoMappingExtensions.DescriptionPreviewMaxLength);
        }

        [Fact]
        public void ToDescriptionPreview_DoesNotSplitSurrogatePair()
        {
            // Emoji (para surogatów) zaczyna się dokładnie na ostatnim dozwolonym znaku
            var description =
                new string('a', JobOfferDtoMappingExtensions.DescriptionPreviewMaxLength - 1)
                + "😀"
                + "reszta";

            var preview = description.ToDescriptionPreview();

            preview
                .Should()
                .HaveLength(JobOfferDtoMappingExtensions.DescriptionPreviewMaxLength - 1);
            char.IsHighSurrogate(preview[^1]).Should().BeFalse();
        }
    }
}
