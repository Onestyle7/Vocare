using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.UserManagement.Exceptions
{
    public class CvParsingFailedException : BusinessRuleException
    {
        public string ErrorDetails { get; }

        public CvParsingFailedException(string errorDetails)
            : base($"CV parsing failed: {errorDetails}", "CV_PARSING_FAILED")
        {
            ErrorDetails = errorDetails;
        }
    }
}
