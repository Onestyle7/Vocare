namespace VocareWebAPI.Shared.Exceptions
{
    public abstract class ForbiddenException : DomainException
    {
        protected ForbiddenException(string message, string errorCode)
            : base(message, errorCode) { }
    }
}
