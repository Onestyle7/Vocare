using System.ComponentModel.DataAnnotations;

namespace VocareWebAPI.Billing.Configuration
{
    /// <summary>
    /// Rabat na jednorazowy zakup tokenów przyznawany za zgodę marketingową.
    /// Kupon (np. 25%, duration: once) zakłada się ręcznie w Stripe Dashboard.
    /// </summary>
    public class ConsentDiscountConfig
    {
        public const string SectionName = "ConsentDiscount";

        /// <summary>
        /// ID kuponu Stripe, wymagane na produkcji. Pusty tylko lokalnie – przyznanie rabatu
        /// jest zapisywane, ale Checkout go nie nalicza.
        /// </summary>
        public string CouponId { get; set; } = string.Empty;

        /// <summary>
        /// Wysokość rabatu wyświetlana na froncie – musi zgadzać się z kuponem w Stripe,
        /// który faktycznie nalicza rabat w Checkout.
        /// </summary>
        [Range(1, 100, ErrorMessage = "ConsentDiscount:PercentOff must be between 1 and 100")]
        public int PercentOff { get; set; } = 25;

        [Range(1, 365, ErrorMessage = "ConsentDiscount:ValidityDays must be between 1 and 365")]
        public int ValidityDays { get; set; } = 7;

        public bool IsEnabled => !string.IsNullOrWhiteSpace(CouponId);
    }
}
