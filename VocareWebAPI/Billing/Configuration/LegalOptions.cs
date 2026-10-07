using System.ComponentModel.DataAnnotations;

namespace VocareWebAPI.Billing.Configuration
{
    /// <summary>
    /// Dane usługodawcy używane w dokumentach wysyłanych konsumentom (potwierdzenie zawarcia umowy).
    /// Muszą odpowiadać SERVICE_PROVIDER we frontendzie (frontend/features/marketing/constants/legal.ts).
    /// </summary>
    public class LegalOptions
    {
        public const string SectionName = "Legal";

        [Required]
        public string ProviderName { get; set; } = string.Empty;

        // Pusty do czasu podania adresu do doręczeń – wtedy pomijany w mailach
        public string? ProviderAddress { get; set; }

        [Required, EmailAddress]
        public string ContactEmail { get; set; } = string.Empty;

        [Required, Url]
        public string TermsUrl { get; set; } = string.Empty;

        [Required, Url]
        public string PrivacyPolicyUrl { get; set; } = string.Empty;

        /// <summary>
        /// PDF bieżącej wersji Regulaminu (generowany przez frontend), dołączany do potwierdzenia
        /// zakupu – link do strony nie jest trwałym nośnikiem (art. 21 ust. 1 i art. 12 ust. 1 UoPK).
        /// </summary>
        [Required, Url]
        public string TermsPdfUrl { get; set; } = string.Empty;
    }
}
