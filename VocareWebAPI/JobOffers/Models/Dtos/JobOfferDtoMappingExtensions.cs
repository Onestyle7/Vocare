using VocareWebAPI.JobOffers.Models.Entities;

namespace VocareWebAPI.JobOffers.Models.Dtos
{
    /// <summary>
    /// Wspólne mapowania pól oferty pracy na DTO zwracane do frontendu
    /// </summary>
    public static class JobOfferDtoMappingExtensions
    {
        public const int DescriptionPreviewMaxLength = 1000;
        public const string RemoteLocationLabel = "Remote";

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
        /// Początek pełnego opisu oferty. Nie jest zapisywany w bazie - liczony przy każdym mapowaniu.
        /// Opis zostaje w HTML-u, czyszczeniem zajmuje się frontend.
        /// </summary>
        public static string ToDescriptionPreview(this string? description)
        {
            if (string.IsNullOrEmpty(description))
                return "";

            if (description.Length <= DescriptionPreviewMaxLength)
                return description;

            var length = DescriptionPreviewMaxLength;
            // Nie rozcinamy pary surogatów (np. emoji) - inaczej powstałby niepoprawny znak
            if (char.IsHighSurrogate(description[length - 1]))
                length--;

            return description[..length];
        }
    }
}
