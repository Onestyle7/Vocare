using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Services.Interfaces;

namespace VocareWebAPI.UserManagement.Services.Implementations
{
    public class TokenService : ITokenService
    {
        private readonly IDataProtectionProvider _dataProtectionProvider;

        public TokenService(IDataProtectionProvider dataProtectionProvider)
        {
            _dataProtectionProvider = dataProtectionProvider;
        }

        public string GenerateToken(User user, bool consentsValid, int expirationHours = 1)
        {
            var protector = _dataProtectionProvider.CreateProtector("VocareAuth");

            var tokenData = new
            {
                sub = user.Id,
                email = user.Email,
                consents_valid = consentsValid,
                jti = Guid.NewGuid().ToString(),
                exp = DateTimeOffset.UtcNow.AddHours(expirationHours).ToUnixTimeSeconds(),
                iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            };

            var json = JsonSerializer.Serialize(tokenData);
            return protector.Protect(json);
        }
    }
}
