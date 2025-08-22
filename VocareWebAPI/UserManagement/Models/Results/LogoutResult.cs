using System.Collections.Generic;

namespace VocareWebAPI.UserManagement.Models.Results
{
    public class LogoutResult
    {
        public bool Success { get; private set; }
        public string? Message { get; private set; }
        public string? ErrorMessage { get; private set; }
        public IEnumerable<string>? Errors { get; private set; }

        private LogoutResult() { }

        public static LogoutResult Successful(string message = "Logged out successfully")
        {
            return new LogoutResult { Success = true, Message = message };
        }

        public static LogoutResult Failed(string errorMessage, IEnumerable<string>? errors = null)
        {
            return new LogoutResult
            {
                Success = false,
                ErrorMessage = errorMessage,
                Errors = errors,
            };
        }
    }
}
