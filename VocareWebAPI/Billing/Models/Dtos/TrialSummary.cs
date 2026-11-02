namespace VocareWebAPI.Billing.Models.Dtos
{
    /// <summary>
    /// Trwający okres próbny pobrany ze Stripe: kiedy się kończy, ile i jak często zostanie
    /// pobrane po nim, oraz czy Użytkownik już anulował subskrypcję (wtedy nic nie pobierzemy).
    /// </summary>
    public record TrialSummary(
        DateTime TrialEndUtc,
        long? RecurringAmount,
        string? Currency,
        string Interval,
        long IntervalCount,
        bool CancelAtPeriodEnd
    );
}
