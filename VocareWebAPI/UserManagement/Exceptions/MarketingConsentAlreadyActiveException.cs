using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.UserManagement.Exceptions
{
    public class MarketingConsentAlreadyActiveException : ConflictException
    {
        public MarketingConsentAlreadyActiveException()
            : base("Marketing consent is already active.", "MARKETING_CONSENT_ALREADY_ACTIVE") { }
    }
}
