using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Notifications.Models.Enums;

namespace VocareWebAPI.Notifications.Models.Entities
{
    public class Notification
    {
        public Guid Id { get; set; }

        [ForeignKey("UserId")]
        public string UserId { get; set; } = default!;

        [JsonIgnore]
        public User User { get; set; } = default!;
        public string Title { get; set; } = String.Empty;
        public string Message { get; set; } = String.Empty;
        public NotificationType Type { get; set; } = default!;
        public Guid? RelatedEntityId { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReadAt { get; set; }
    }
}
