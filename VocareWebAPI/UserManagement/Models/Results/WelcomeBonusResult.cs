using VocareWebAPI.UserManagement.Models.Enums;

namespace VocareWebAPI.UserManagement.Models.Results
{
    public record WelcomeBonusResult(WelcomeBonusStatus Status, int Amount);
}