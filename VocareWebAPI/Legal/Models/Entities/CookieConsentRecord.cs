using VocareWebAPI.Legal.Models.Enums;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Legal.Models.Entities
{
    public class CookieConsentRecord
    {
        public Guid Id { get; set; }

        public Guid ConsentId { get; set; }
        public string? UserId { get; set; }
        public virtual User? User { get; set; }
        public bool AnalyticsGranted { get; set; }
        public CookieConsentSource Source { get; set; }
        public string TextVersion { get; set; } = "";
        public bool AdsGranted { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
