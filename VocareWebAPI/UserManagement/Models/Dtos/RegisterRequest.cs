using System.ComponentModel.DataAnnotations;

namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        [StringLength(
            100,
            MinimumLength = 6,
            ErrorMessage = "Password must be between 6 and 100 characters."
        )]
        public required string Password { get; set; }

        [Required(ErrorMessage = "Password confirmation is required.")]
        [Compare("Password", ErrorMessage = "Password and confirmation password do not match.")]
        public required string ConfirmPassword { get; set; }
        public bool AcceptMarketingConsent { get; set; } = false;
    }
}
