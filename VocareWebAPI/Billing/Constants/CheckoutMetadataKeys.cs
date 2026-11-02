namespace VocareWebAPI.Billing.Constants
{
    /// <summary>
    /// Klucze metadanych sesji Checkout – zapisywane w StripeService, odczytywane w webhookach.
    /// </summary>
    public static class CheckoutMetadataKeys
    {
        /// <summary>Sesja z rabatem za zgodę marketingową ("true").</summary>
        public const string ConsentDiscount = "consentDiscount";
    }
}
