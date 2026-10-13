namespace VocareWebAPI.Billing.Models.Dtos
{
    /// <summary>
    /// Dane potwierdzenia zawarcia umowy wysyłanego na trwałym nośniku (art. 21 ust. 1 UoPK).
    /// Serializowane przez Hangfire, dlatego tylko proste typy.
    /// </summary>
    public class PurchaseConfirmationDto
    {
        public string Email { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public string CheckoutMode { get; set; } = string.Empty;
        public string PackageName { get; set; } = string.Empty;
        public long? AmountTotal { get; set; }
        public string? Currency { get; set; }
        public DateTime PurchasedAtUtc { get; set; }
    }
}
