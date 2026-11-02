using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    /// <summary>
    /// Ten sam event Stripe jest właśnie obsługiwany przez inną dostawę. Odpowiedź 409 sprawia,
    /// że Stripe ponowi event później, zamiast uznać go za obsłużony.
    /// </summary>
    public class StripeEventInProgressException : ConflictException
    {
        public string EventId { get; }

        public StripeEventInProgressException(string eventId)
            : base($"Stripe event {eventId} is being processed.", "STRIPE_EVENT_IN_PROGRESS")
        {
            EventId = eventId;
        }
    }
}
