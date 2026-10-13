using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Legal.Exceptions
{
    public class EmptyConsentDocumentsException : BusinessRuleException
    {
        public EmptyConsentDocumentsException()
            : base("The list of document IDs for consent acceptance cannot be empty.", "EMPTY_CONSENT_DOCUMENTS")
        {
        }
    }
}
