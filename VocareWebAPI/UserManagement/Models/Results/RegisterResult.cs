using System.Collections.Generic;

namespace VocareWebAPI.UserManagement.Models.Results
{
    public class RegisterResult
    {
        public bool Success { get; private set; }
        public string? UserId { get; private set; }
        public string? ErrorMessage { get; private set; }
        public IEnumerable<string>? Errors { get; private set; }
        public WelcomeBonusResult? WelcomeBonus { get; private set; }

        private RegisterResult() { }

        public static RegisterResult Successful(string userId, WelcomeBonusResult? welcomeBonus = null)
        {
            return new RegisterResult
            {
                Success = true,
                UserId = userId,
                WelcomeBonus = welcomeBonus,
            };
        }

        public static RegisterResult Failed(string errorMessage, IEnumerable<string>? errors = null)
        {
            return new RegisterResult
            {
                Success = false,
                ErrorMessage = errorMessage,
                Errors = errors,
            };
        }
    }
}
