using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class NoActiveSubscriptionException : BusinessRuleException
    {
        public string UserId { get; }

        public NoActiveSubscriptionException(string userId)
            : base($"User {userId} has no active subscription to cancel.", "NO_ACTIVE_SUBSCRIPTION")
        {
            UserId = userId;
        }
    }
}
