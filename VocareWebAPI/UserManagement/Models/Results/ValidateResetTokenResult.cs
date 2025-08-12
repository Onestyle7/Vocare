using System.Collections.Generic;

namespace VocareWebAPI.UserManagement.Models.Results
{
    public class ValidateResetTokenResult
    {
        public bool Success { get; private set; }
        public bool IsValid { get; private set; }
        public string? Message { get; private set; }
        public string? ErrorMessage { get; private set; }
        public IEnumerable<string>? Errors { get; private set; }

        private ValidateResetTokenResult() { }

        public static ValidateResetTokenResult Successful(bool isValid, string message)
        {
            return new ValidateResetTokenResult
            {
                Success = true,
                IsValid = isValid,
                Message = message,
            };
        }

        public static ValidateResetTokenResult Failed(
            string errorMessage,
            IEnumerable<string>? errors = null
        )
        {
            return new ValidateResetTokenResult
            {
                Success = false,
                ErrorMessage = errorMessage,
                Errors = errors,
            };
        }
    }
}
