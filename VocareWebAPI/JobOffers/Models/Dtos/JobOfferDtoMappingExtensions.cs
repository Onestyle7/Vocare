using System.Text.RegularExpressions;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.Shared.Extensions;

namespace VocareWebAPI.JobOffers.Models.Dtos
{
    /// <summary>
    /// Wspólne mapowania pól oferty pracy na DTO zwracane do frontendu
    /// </summary>
    public static partial class JobOfferDtoMappingExtensions
    {
        public const int DescriptionPreviewMaxLength = 300;
        public const string RemoteLocationLabel = "Remote";

        /// <summary>
        /// Brief krótszy niż tyle znaków (po usunięciu HTML) nie jest opisem, tylko resztką po formatowaniu,
        /// np. "&lt;p&gt;&lt;b&gt;&lt;/b&gt;&lt;/p&gt;" albo jedno zdanie bez treści.
        /// </summary>
        private const int MinBriefLength = 60;

        /// <summary>
        /// Lista lokalizacji do wyświetlenia: unikalne miasta + jedno "Remote", jeśli oferta dopuszcza pracę zdalną.
        /// NoFluffJobs zapisuje zdalność jako osobny wpis bez miasta, a SolidJobs jako flagę IsRemote przy każdym mieście,
        /// dlatego miasta nie mogą znikać tylko dlatego, że wpis ma IsRemote = true.
        /// </summary>
        public static List<string> ToDisplayLocations(this IEnumerable<JobOfferLocation>? locations)
        {
            if (locations == null)
                return new List<string>();

            var locationList = locations.ToList();

            var result = locationList
                .Select(l => l.City?.Trim() ?? "")
                .Where(city => city.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (locationList.Any(l => l.IsRemote))
                result.Add(RemoteLocationLabel);

            return result;
        }

        /// <summary>
        /// Gotowy do wyświetlenia podgląd opisu (czysty tekst): sensowny brief, a gdy go brak (SolidJobs nie ma briefu,
        /// część briefów NoFluffJobs to puste tagi albo powtórzony tytuł) - początek pełnego opisu.
        /// Nie jest zapisywany w bazie - liczony przy każdym mapowaniu.
        /// </summary>
        public static string ToDescriptionPreview(this JobOffer offer)
        {
            var brief = offer.BriefDescription.ToPlainText();
            var isBriefSameAsTitle = string.Equals(
                brief,
                offer.Title?.Trim(),
                StringComparison.OrdinalIgnoreCase
            );

            if (brief.Length >= MinBriefLength && !isBriefSameAsTitle)
                return TruncatePreview(brief);

            // SolidJobs zaczyna każdy opis tym samym nagłówkiem - w podglądzie jest zbędny
            var description = SolidJobsDescriptionHeaderRegex()
                .Replace(offer.Description.ToPlainText(), "");
            if (description.Length > 0)
                return TruncatePreview(description);

            return isBriefSameAsTitle ? "" : TruncatePreview(brief);
        }

        private static string TruncatePreview(string text)
        {
            if (text.Length <= DescriptionPreviewMaxLength)
                return text;

            var length = DescriptionPreviewMaxLength;
            // Nie rozcinamy pary surogatów (np. emoji) - inaczej powstałby niepoprawny znak
            if (char.IsHighSurrogate(text[length - 1]))
                length--;

            var cut = text[..length];
            // Ucinamy na granicy słowa, jeśli nie traci to więcej niż połowy tekstu
            var lastSpace = cut.LastIndexOf(' ');
            if (lastSpace > length / 2)
                cut = cut[..lastSpace];

            return cut.TrimEnd(' ', ',', ';', ':', '-') + "…";
        }

        [GeneratedRegex(@"^Czym będziesz się zajmować\?\s*", RegexOptions.IgnoreCase)]
        private static partial Regex SolidJobsDescriptionHeaderRegex();
    }
}
