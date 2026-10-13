using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using VocareWebAPI.Shared.Configuration;
using VocareWebAPI.Shared.Services.Interfaces;

namespace VocareWebAPI.Shared.Services.Implementations;

public class ClientInfoProvider(
    IHttpContextAccessor httpContextAccessor,
    IOptions<InternalApiOptions> options
) : IClientInfoProvider
{
    public const string InternalApiKeyHeader = "X-Internal-Api-Key";
    public const string ClientIpHeader = "X-Client-IP";
    public const string ClientUserAgentHeader = "X-Client-User-Agent";

    private const string UnknownIpAddress = "unknown";

    // Matches the UserConsents.UserAgent column length.
    private const int MaxUserAgentLength = 1000;

    private readonly byte[] _internalApiKey = Encoding.UTF8.GetBytes(options.Value.Key);

    public ClientInfo GetClientInfo()
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return new ClientInfo(UnknownIpAddress, string.Empty);
        }

        var request = httpContext.Request;
        var remoteIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? UnknownIpAddress;
        var remoteUserAgent = request.Headers.UserAgent.ToString();

        if (!HasValidInternalApiKey(request))
        {
            return new ClientInfo(remoteIp, Truncate(remoteUserAgent));
        }

        var forwardedIp = request.Headers[ClientIpHeader].ToString().Trim();
        var forwardedUserAgent = request.Headers[ClientUserAgentHeader].ToString();

        var ipAddress = IPAddress.TryParse(forwardedIp, out var parsedIp)
            ? parsedIp.ToString()
            : remoteIp;
        var userAgent = string.IsNullOrWhiteSpace(forwardedUserAgent)
            ? remoteUserAgent
            : forwardedUserAgent;

        return new ClientInfo(ipAddress, Truncate(userAgent));
    }

    private bool HasValidInternalApiKey(HttpRequest request)
    {
        var providedKey = request.Headers[InternalApiKeyHeader].ToString();
        if (string.IsNullOrEmpty(providedKey) || _internalApiKey.Length == 0)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(providedKey),
            _internalApiKey
        );
    }

    private static string Truncate(string value) =>
        value.Length > MaxUserAgentLength ? value[..MaxUserAgentLength] : value;
}
