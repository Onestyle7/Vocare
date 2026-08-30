using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class UserBillingNotFoundException : NotFoundException
    {
        public string UserId { get; }

        public UserBillingNotFoundException(string userId)
            : base(
                $"User billing information for user ID {userId} not found",
                "USER_BILLING_NOT_FOUND"
            )
        {
            UserId = userId;
        }
    }
}
