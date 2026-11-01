namespace VocareWebAPI.Billing.Models.Dtos
{
    /// <summary>
    /// Warunki subskrypcji pobrane ze Stripe na potrzeby potwierdzenia zawarcia umowy:
    /// koniec okresu próbnego i cena za okres rozliczeniowy (art. 12 ust. 1 UoPK).
    /// </summary>
    public record SubscriptionDetails(
        DateTime? TrialEndUtc,
        long? RecurringAmount,
        string? Currency,
        string Interval,
        long IntervalCount
    );
}
