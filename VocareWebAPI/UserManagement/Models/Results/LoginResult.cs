using System;
using System.Collections.Generic;

namespace VocareWebAPI.UserManagement.Models.Results
{
    public class LoginResult
    {
        public bool Success { get; private set; }
        public string? Token { get; private set; }
        public string? UserId { get; private set; }
        public string? Email { get; private set; }
        public int ExpiresIn { get; private set; } // W sekundach
        public string? ErrorMessage { get; private set; }
        public IEnumerable<string>? Errors { get; private set; }

        private LoginResult() { }

        public static LoginResult Successful(
            string token,
            string userId,
            string email,
            int expiresIn = 3600
        )
        {
            return new LoginResult
            {
                Success = true,
                Token = token,
                UserId = userId,
                Email = email,
                ExpiresIn = expiresIn,
            };
        }

        public static LoginResult Failed(string errorMessage, IEnumerable<string>? errors = null)
        {
            return new LoginResult
            {
                Success = false,
                ErrorMessage = errorMessage,
                Errors = errors,
            };
        }
    }
}
