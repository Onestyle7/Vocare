using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class UserBillingAlreadyExistsException : ConflictException
    {
        public string UserId { get; }

        public UserBillingAlreadyExistsException(string userId)
            : base(
                $"User billing information for user ID {userId} already exists.",
                "USER_BILLING_ALREADY_EXISTS"
            )
        {
            UserId = userId;
        }
    }
}
