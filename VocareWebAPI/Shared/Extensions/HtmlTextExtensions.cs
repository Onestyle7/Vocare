using System.Net;
using System.Text.RegularExpressions;

namespace VocareWebAPI.Shared.Extensions
{
    public static partial class HtmlTextExtensions
    {
        /// <summary>
        /// Zamienia HTML na czysty tekst: usuwa tagi (razem z inline style), dekoduje encje i scala białe znaki.
        /// </summary>
        public static string ToPlainText(this string? html)
        {
            if (string.IsNullOrWhiteSpace(html))
                return "";

            var withoutTags = TagRegex().Replace(html, " ");
            // Tag ucięty w połowie, np. gdy HTML został wcześniej przycięty do określonej długości
            withoutTags = UnclosedTagRegex().Replace(withoutTags, " ");

            return WhitespaceRegex().Replace(WebUtility.HtmlDecode(withoutTags), " ").Trim();
        }

        [GeneratedRegex("<[^>]*>")]
        private static partial Regex TagRegex();

        [GeneratedRegex("<[^>]*$")]
        private static partial Regex UnclosedTagRegex();

        [GeneratedRegex(@"\s+")]
        private static partial Regex WhitespaceRegex();
    }
}
