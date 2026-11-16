using System.ComponentModel.DataAnnotations;

namespace VocareWebAPI.Legal.Configuration
{
    public class CookieConsentConfig
    {
        public const string SectionName = "CookieConsent";

        [Range(1, 10, ErrorMessage = "CookieConsent:RetentionYears must be between 1 and 10")]
        public int RetentionYears { get; set; } = 3;
    }
}
