using System.Collections.Generic;

namespace VocareWebAPI.UserManagement.Models.Results
{
    public class ForgotPasswordResult
    {
        public bool Success { get; private set; }
        public string? Message { get; private set; }
        public string? ErrorMessage { get; private set; }
        public IEnumerable<string>? Errors { get; private set; }

        private ForgotPasswordResult() { }

        public static ForgotPasswordResult Successful(
            string message = "If email is registered, reset link sent."
        )
        {
            return new ForgotPasswordResult { Success = true, Message = message };
        }

        public static ForgotPasswordResult Failed(
            string errorMessage,
            IEnumerable<string>? errors = null
        )
        {
            return new ForgotPasswordResult
            {
                Success = false,
                ErrorMessage = errorMessage,
                Errors = errors,
            };
        }
    }
}
