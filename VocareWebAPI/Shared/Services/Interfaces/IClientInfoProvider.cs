namespace VocareWebAPI.Shared.Services.Interfaces;

/// <summary>
/// IP address and User-Agent of the end user's browser.
/// </summary>
public record ClientInfo(string IpAddress, string UserAgent);

/// <summary>
/// Resolves the end user's IP address and User-Agent for the current request.
/// Requests proxied by the Next.js server carry the browser's values in dedicated headers,
/// which are trusted only when accompanied by a valid internal API key.
/// </summary>
public interface IClientInfoProvider
{
    ClientInfo GetClientInfo();
}
