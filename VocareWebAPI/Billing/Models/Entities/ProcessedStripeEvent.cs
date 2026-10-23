namespace VocareWebAPI.Billing.Models.Entities
{
    /// <summary>
    /// Event Stripe przyjęty do obsługi. Stripe może dostarczyć ten sam event wielokrotnie
    /// (ponowienia po timeoucie, kilka endpointów), a klucz główny na Id pozwala obsłużyć go raz.
    /// </summary>
    public class ProcessedStripeEvent
    {
        public required string Id { get; set; }
        public required string Type { get; set; }
        public DateTime ProcessedAt { get; set; }
    }
}
