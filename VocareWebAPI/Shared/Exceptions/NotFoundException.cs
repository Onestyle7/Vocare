namespace VocareWebAPI.Shared.Exceptions
{
    public abstract class NotFoundException : DomainException
    {
        protected NotFoundException(string message, string errorCode)
            : base(message, errorCode) { }
    }
}
