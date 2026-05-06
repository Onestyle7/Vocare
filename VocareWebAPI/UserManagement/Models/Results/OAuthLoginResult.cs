using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Results
{
    public class OAuthLoginResult
    {
        public bool Success { get; private set; }
        public string? AccessToken { get; private set; }
        public string? RefreshToken { get; private set; }
        public string? UserId { get; private set; }
        public string? Email { get; private set; }
        public int ExpiresIn { get; private set; }
        public bool IsNewUser { get; private set; }
        public string? ErrorMessage { get; private set; }
        public IEnumerable<string>? Errors { get; private set; }

        private OAuthLoginResult() { }

        public static OAuthLoginResult Successful(
            string token,
            string refreshToken,
            string userId,
            string email,
            bool isNewUser,
            int expiresIn = 3600
        )
        {
            return new OAuthLoginResult
            {
                Success = true,
                AccessToken = token,
                RefreshToken = refreshToken,
                UserId = userId,
                Email = email,
                IsNewUser = isNewUser,
                ExpiresIn = expiresIn,
            };
        }

        public static OAuthLoginResult Failed(
            string errorMessage,
            IEnumerable<string>? errors = null
        )
        {
            return new OAuthLoginResult
            {
                Success = false,
                ErrorMessage = errorMessage,
                Errors = errors,
            };
        }
    }
}
