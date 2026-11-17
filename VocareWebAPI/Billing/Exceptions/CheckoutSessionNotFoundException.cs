using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class CheckoutSessionNotFoundException : NotFoundException
    {
        public string SessionId { get; }

        public CheckoutSessionNotFoundException(string sessionId)
            : base($"Checkout session '{sessionId}' not found.", "CHECKOUT_SESSION_NOT_FOUND")
        {
            SessionId = sessionId;
        }
    }
}
