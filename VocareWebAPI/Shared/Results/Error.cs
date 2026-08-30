namespace VocareWebAPI.Shared.Results
{
    public record Error(string Code, string Message, int StatusCode = 422);
}
