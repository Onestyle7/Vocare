using System.Collections.Generic;
using System.Linq;
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

        private const string LongBrief =
            "<p>We are looking for a <b>Senior Backend Developer</b> to join our team building payment APIs.</p>";

        private static JobOffer Offer(
            string briefDescription,
            string description = "",
            string title = "Senior QA Java"
        ) =>
            new()
            {
                Title = title,
                BriefDescription = briefDescription,
                Description = description,
            };

        [Fact]
        public void ToDescriptionPreview_UsesMeaningfulBriefAsPlainText()
        {
            Offer(LongBrief, "<p>Pełny opis</p>")
                .ToDescriptionPreview()
                .Should()
                .Be(
                    "We are looking for a Senior Backend Developer to join our team building payment APIs."
                );
        }

        [Theory]
        [InlineData("<p><b></b></p>\n<p><br></p>")]
        [InlineData("<h3>Senior QA Java</h3>")]
        [InlineData("")]
        public void ToDescriptionPreview_WhenBriefIsUseless_FallsBackToDescription(string brief)
        {
            Offer(brief, "<p>Pełny&nbsp;opis &amp; więcej</p>")
                .ToDescriptionPreview()
                .Should()
                .Be("Pełny opis & więcej");
        }

        [Fact]
        public void ToDescriptionPreview_StripsSolidJobsHeaderAndInlineStyles()
        {
            const string description =
                "<div class=\"well job - description\"><p><strong>Czym będziesz się zajmować?</strong><br><br>"
                + "<span style=\"color: rgb(55, 51, 57); background-color: rgb(255, 255, 255);\">Szukamy testera</span>";

            Offer("", description).ToDescriptionPreview().Should().Be("Szukamy testera");
        }

        [Fact]
        public void ToDescriptionPreview_KeepsShortBriefWhenThereIsNoDescription()
        {
            Offer("<p>Rozwój systemów i oprogramowania.</p>")
                .ToDescriptionPreview()
                .Should()
                .Be("Rozwój systemów i oprogramowania.");
        }

        [Fact]
        public void ToDescriptionPreview_WhenNothingToShow_ReturnsEmpty()
        {
            Offer("<h3>Senior QA Java</h3>").ToDescriptionPreview().Should().BeEmpty();
            Offer("").ToDescriptionPreview().Should().BeEmpty();
        }

        [Fact]
        public void ToDescriptionPreview_WhenLong_TruncatesOnWordBoundaryWithEllipsis()
        {
            var description = "<p>" + string.Join(" ", Enumerable.Repeat("słowo", 200)) + "</p>";

            var preview = Offer("", description).ToDescriptionPreview();

            preview
                .Length.Should()
                .BeLessThanOrEqualTo(JobOfferDtoMappingExtensions.DescriptionPreviewMaxLength + 1);
            preview.Should().EndWith("słowo…");
        }

        [Fact]
        public void ToDescriptionPreview_DoesNotSplitSurrogatePair()
        {
            // Emoji (para surogatów) zaczyna się dokładnie na ostatnim dozwolonym znaku, bez spacji w pobliżu
            var description =
                new string('a', JobOfferDtoMappingExtensions.DescriptionPreviewMaxLength - 1)
                + "😀"
                + "reszta";

            var preview = Offer("", description).ToDescriptionPreview();

            preview.Should().EndWith("…");
            char.IsHighSurrogate(preview[^2]).Should().BeFalse();
        }
    }
}
