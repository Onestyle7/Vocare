namespace VocareWebAPI.Shared.Exceptions
{
    public abstract class DomainException : Exception
    {
        public string ErrorCode { get; }

        protected DomainException(string message, string errorCode)
            : base(message)
        {
            ErrorCode = errorCode;
        }

        protected DomainException(string message, string errorCode, Exception innerException)
            : base(message, innerException)
        {
            ErrorCode = errorCode;
        }
    }
}
