using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class SubscriptionAlreadyCanceledException : ConflictException
    {
        public string UserId { get; }
        public DateTime? SubscriptionEndDate { get; }

        public SubscriptionAlreadyCanceledException(string userId, DateTime? subscriptionEndDate)
            : base(
                $"Subscription for user {userId} is already canceled.",
                "SUBSCRIPTION_ALREADY_CANCELED"
            )
        {
            UserId = userId;
            SubscriptionEndDate = subscriptionEndDate;
        }
    }
}
