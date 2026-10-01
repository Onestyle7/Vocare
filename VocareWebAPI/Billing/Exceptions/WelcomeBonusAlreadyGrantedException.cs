using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class WelcomeBonusAlreadyGrantedException : ConflictException
    {
        public string UserId { get; }

        public WelcomeBonusAlreadyGrantedException(string userId)
            : base(
                $"User billing information for user ID {userId} already exists.",
                "WELCOME_BONUS_ALREADY_GRANTED"
            )
        {
            UserId = userId;
        }
    }
}
