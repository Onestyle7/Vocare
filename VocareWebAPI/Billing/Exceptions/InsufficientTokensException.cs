using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Exceptions
{
    public class InsufficientTokensException : BusinessRuleException
    {
        public string UserId { get; }
        public int CurrentBalance { get; }
        public int RequiredTokens { get; }

        public InsufficientTokensException(string userId, int currentBalance, int requiredTokens)
            : base(
                $"User {userId} does not have enough tokens. Current: {currentBalance}, required: {requiredTokens}.",
                "INSUFFICIENT_TOKENS"
            )
        {
            UserId = userId;
            CurrentBalance = currentBalance;
            RequiredTokens = requiredTokens;
        }
    }
}
