using System.Collections.Generic;

namespace VocareWebAPI.UserManagement.Models.Results
{
    public class RegisterResult
    {
        public bool Success { get; private set; }
        public string? UserId { get; private set; }
        public string? ErrorMessage { get; private set; }
        public IEnumerable<string>? Errors { get; private set; }

        private RegisterResult() { }

        public static RegisterResult Successful(string userId)
        {
            return new RegisterResult { Success = true, UserId = userId };
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
