using System.Collections.Generic;

namespace VocareWebAPI.UserManagement.Models.Results
{
    public class RefreshResult
    {
        public bool Success { get; private set; }
        public string? Token { get; private set; }
        public int ExpiresIn { get; private set; }
        public string? ErrorMessage { get; private set; }
        public IEnumerable<string>? Errors { get; private set; }

        private RefreshResult() { }

        public static RefreshResult Successful(string token, int expiresIn = 3600)
        {
            return new RefreshResult
            {
                Success = true,
                Token = token,
                ExpiresIn = expiresIn,
            };
        }

        public static RefreshResult Failed(string errorMessage, IEnumerable<string>? errors = null)
        {
            return new RefreshResult
            {
                Success = false,
                ErrorMessage = errorMessage,
                Errors = errors,
            };
        }
    }
}
