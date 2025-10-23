using System.Threading.Tasks;
using VocareWebAPI.Shared.Models; // Dla Result<T>
using VocareWebAPI.UserManagement.Models.Results; // Dla custom Result models jak LoginResult

namespace VocareWebAPI.UserManagement.Services.Interfaces
{
    public interface IAuthenticationServiceOwn
    {
        Task<Result<ForgotPasswordResult>> ForgotPasswordAsync(string email);

        Task<Result<ResetPasswordResult>> ResetPasswordAsync(
            string email,
            string token,
            string newPassword
        );

        Task<Result<ValidateResetTokenResult>> ValidateResetTokenAsync(string token, string email);

        Task<Result<RegisterResult>> RegisterAsync(
            string email,
            string password,
            bool acceptMarketingConsent,
            string? ipAddress
        );

        Task<Result<LoginResult>> LoginAsync(string email, string password);

        Task<Result<RefreshResult>> RefreshAsync(string refreshToken);

        Task<Result<LogoutResult>> LogoutAsync();

        Task<Result<GoogleLoginResult>> GoogleLoginAsync(string accessToken);
    }
}
