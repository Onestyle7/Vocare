using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.UserManagement.Exceptions
{
    public class MarketingConsentNotActiveException : BusinessRuleException
    {
        public MarketingConsentNotActiveException()
            : base("Marketing consent is not active for the user.", "MARKETING_CONSENT_NOT_ACTIVE")
        { }
    }
}
