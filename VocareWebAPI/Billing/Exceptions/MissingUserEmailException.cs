using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class MissingUserEmailException : BusinessRuleException
    {
        public string UserId { get; }

        public MissingUserEmailException(string userId)
            : base(
                $"Email is required to create a StripeCustomer for user {userId}",
                "MISSING_USER_EMAIL"
            )
        {
            UserId = userId;
        }
    }
}
