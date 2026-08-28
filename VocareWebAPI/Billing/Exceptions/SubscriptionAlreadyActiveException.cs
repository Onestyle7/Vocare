using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class SubscriptionAlreadyActiveException : ConflictException
    {
        public string UserId { get; }

        public SubscriptionAlreadyActiveException(string userId)
            : base(
                $"User {userId} already has an active subscription.",
                "SUBSCRIPTION_ALREADY_ACTIVE"
            )
        {
            UserId = userId;
        }
    }
}
