using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.UserManagement.Models.Entities
{
    public class CvParseHistory
    {
        [Key]
        public int Id { get; set; }
        public string UserId { get; set; } = default!;

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = default!;
        public DateTime ParseDate { get; set; }
        public string? FileName { get; set; }
        public long? FileSize { get; set; }
    }
}
