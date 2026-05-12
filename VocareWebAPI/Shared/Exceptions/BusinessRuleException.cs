namespace VocareWebAPI.Shared.Exceptions
{
    public abstract class BusinessRuleException : DomainException
    {
        protected BusinessRuleException(string message, string errorCode)
            : base(message, errorCode) { }
    }
}
