using FluentAssertions;
using VocareWebAPI.Shared.Extensions;
using Xunit;

namespace VocareWebApi.Tests.Shared
{
    /// <summary>
    /// Testy jednostkowe <see cref="HtmlTextExtensions.ToPlainText"/> – zamiana opisów ofert z HTML na czysty tekst.
    /// </summary>
    public sealed class HtmlTextExtensionsTests
    {
        [Theory]
        [InlineData(null, "")]
        [InlineData("   ", "")]
        [InlineData("<p>Hello&nbsp;<b>world</b></p>\n<br>  again", "Hello world again")]
        [InlineData(
            "Telephony &amp; Contact &lt;3 &quot;x&quot; it&#39;s Kraj&oacute;w",
            "Telephony & Contact <3 \"x\" it's Krajów"
        )]
        [InlineData(
            "<span style=\"color: rgb(55, 51, 57); background-color: rgb(255, 255, 255);\">Tekst</span>",
            "Tekst"
        )]
        public void ToPlainText_StripsTagsDecodesEntitiesAndCollapsesWhitespace(
            string? html,
            string expected
        )
        {
            html.ToPlainText().Should().Be(expected);
        }

        [Fact]
        public void ToPlainText_RemovesTagCutInHalf()
        {
            "<p>Opis oferty</p><span style=\"color: rgb(5".ToPlainText().Should().Be("Opis oferty");
        }
    }
}
