using System.Collections.Generic;

namespace VocareWebAPI.UserManagement.Models.Results
{
    public class ResetPasswordResult
    {
        public bool Success { get; private set; }
        public string? Message { get; private set; }
        public string? ErrorMessage { get; private set; }
        public IEnumerable<string>? Errors { get; private set; }

        private ResetPasswordResult() { }

        public static ResetPasswordResult Successful(
            string message = "Password has been reset successfully."
        )
        {
            return new ResetPasswordResult { Success = true, Message = message };
        }

        public static ResetPasswordResult Failed(
            string errorMessage,
            IEnumerable<string>? errors = null
        )
        {
            return new ResetPasswordResult
            {
                Success = false,
                ErrorMessage = errorMessage,
                Errors = errors,
            };
        }
    }
}
