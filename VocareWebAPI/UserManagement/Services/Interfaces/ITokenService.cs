using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.UserManagement.Services.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(User user, bool consentsValid, int expirationHours = 1);
    }
}
