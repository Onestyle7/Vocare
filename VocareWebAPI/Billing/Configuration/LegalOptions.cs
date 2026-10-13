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

        /// <summary>
        /// Adres frontendu zależny od środowiska – przepisywany z Frontend:Url przy rejestracji opcji,
        /// żeby adres serwisu był skonfigurowany w jednym miejscu.
        /// </summary>
        [Required, Url]
        public string FrontendUrl { get; set; } = string.Empty;

        public string TermsUrl => BuildUrl("/terms-of-service");

        public string PrivacyPolicyUrl => BuildUrl("/privacy-policy");

        /// <summary>
        /// PDF bieżącej wersji Regulaminu (generowany przez frontend), dołączany do potwierdzenia
        /// zakupu – link do strony nie jest trwałym nośnikiem (art. 21 ust. 1 i art. 12 ust. 1 UoPK).
        /// </summary>
        public string TermsPdfUrl => BuildUrl("/terms-of-service/pdf");

        private string BuildUrl(string path) => $"{FrontendUrl.TrimEnd('/')}{path}";
    }
}
