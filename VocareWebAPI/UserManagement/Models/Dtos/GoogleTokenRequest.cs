using System.ComponentModel.DataAnnotations;

namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class GoogleTokenRequest
    {
        [Required]
        public required string UserId { get; set; }
    }
}
