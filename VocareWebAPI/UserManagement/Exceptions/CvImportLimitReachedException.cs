using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.UserManagement.Exceptions
{
    public class CvImportLimitReachedException : BusinessRuleException
    {
        public int CurrentImportCount { get; }
        public int ImportLimit { get; }

        public CvImportLimitReachedException(int currentImportCount, int importLimit)
            : base(
                $"CV import limit reached. Current imports: {currentImportCount}, Limit: {importLimit}.",
                "CV_IMPORT_LIMIT_REACHED"
            )
        {
            CurrentImportCount = currentImportCount;
            ImportLimit = importLimit;
        }
    }
}
