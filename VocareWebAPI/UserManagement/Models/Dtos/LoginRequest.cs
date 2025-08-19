using System.ComponentModel.DataAnnotations;

namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class LoginRequest
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        public required string Password { get; set; }

        public bool? UseCookies { get; set; }
        public bool? UseSessionCookies { get; set; }
    }
}
