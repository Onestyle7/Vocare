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

        /// <summary>
        /// Moment rezerwacji eventu do obsługi. Rezerwacja bez <see cref="CompletedAt"/>
        /// starsza niż czas dzierżawy oznacza porzuconą obsługę (np. restart procesu) i może
        /// zostać przejęta przez ponowienie od Stripe.
        /// </summary>
        public DateTime ProcessedAt { get; set; }

        /// <summary>Moment zakończenia obsługi; null = obsługa w toku lub porzucona.</summary>
        public DateTime? CompletedAt { get; set; }
    }
}
