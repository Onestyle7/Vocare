using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.CvGenerator.Exceptions
{
    public class CvLimitReachedException : BusinessRuleException
    {
        public int CurrentCount { get; }
        public int MaxLimit { get; }

        public CvLimitReachedException(int currentCount, int maxLimit)
            : base($"CV limit reached: {currentCount}/{maxLimit}.", "CV_LIMIT_REACHED")
        {
            CurrentCount = currentCount;
            MaxLimit = maxLimit;
        }
    }
}
