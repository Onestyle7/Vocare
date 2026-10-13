using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using VocareWebAPI.UserManagement.Configuration;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Services.Implementations;

public class EmailHashService(IOptions<AntiAbuseOptions> configuration) : IEmailHashService
{
    private readonly string _emailHashKey = configuration.Value.EmailHashKey;

    public string ComputeHash(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is empty or contains only white spaces");
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var keyBytes = Encoding.UTF8.GetBytes(_emailHashKey);
        using var hmac = new HMACSHA256(keyBytes);
        var emailHashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(normalizedEmail));
        return Convert.ToHexString(emailHashBytes).ToLowerInvariant();
    }
}
