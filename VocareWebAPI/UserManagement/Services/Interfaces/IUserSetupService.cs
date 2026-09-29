using VocareWebAPI.UserManagement.Models.Results;

namespace VocareWebAPI.UserManagement.Interfaces
{
    public interface IUserSetupService
    {
        Task SetupNewUserAsync(string userId);
        Task<WelcomeBonusResult> GrantWelcomeTokensAsync(string userId);
        Task<WelcomeBonusResult> GrantOrScheduleWelcomeTokensAsync(string userId);
    }
}
