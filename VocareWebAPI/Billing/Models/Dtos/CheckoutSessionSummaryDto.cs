namespace VocareWebAPI.Billing.Models.Dtos
{
    /// <summary>
    /// Read-only summary of a Stripe Checkout session, used by the frontend to send
    /// Purchase / StartTrial conversion events based on verified data.
    /// </summary>
    public class CheckoutSessionSummaryDto
    {
        public string SessionId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string Mode { get; set; } = string.Empty;
        public bool IsTrial { get; set; }

        /// <summary>Amount after discounts, in major currency units (PLN, not grosze).</summary>
        public decimal AmountTotal { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string PriceId { get; set; } = string.Empty;
        public string PackageName { get; set; } = string.Empty;
    }
}
