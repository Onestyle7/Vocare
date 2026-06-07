using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class MissingStripeCustomerException : BusinessRuleException
    {
        public string UserId { get; }

        public MissingStripeCustomerException(string userId)
            : base(
                $"User {userId} does not have a Stripe customer record.",
                "MISSING_STRIPE_CUSTOMER"
            )
        {
            UserId = userId;
        }
    }
}
