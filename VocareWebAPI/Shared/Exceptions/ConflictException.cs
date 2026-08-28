namespace VocareWebAPI.Shared.Exceptions
{
    public abstract class ConflictException : DomainException
    {
        protected ConflictException(string message, string errorCode)
            : base(message, errorCode) { }
    }
}
