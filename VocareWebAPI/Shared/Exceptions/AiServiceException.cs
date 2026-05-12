namespace VocareWebAPI.Shared.Exceptions
{
    public class AiServiceException : DomainException
    {
        public AiServiceException(string message)
            : base($"AI Service Error: {message}", "AI_SERVICE_ERROR") { }

        public AiServiceException(string message, Exception innerException)
            : base($"AI Service Error: {message}", "AI_SERVICE_ERROR", innerException) { }
    }
}
