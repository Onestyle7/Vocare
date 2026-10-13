namespace VocareWebAPI.Shared.Configuration;

/// <summary>
/// Shared secret that authenticates server-to-server calls from the Next.js frontend.
/// Only requests carrying this key may supply the end user's IP address and User-Agent.
/// </summary>
public class InternalApiOptions
{
    public const string SectionName = "InternalApi";
    public string Key { get; set; } = string.Empty;
}
