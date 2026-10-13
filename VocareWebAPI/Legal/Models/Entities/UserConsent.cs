using VocareWebAPI.Models.Entities;
using VocareWebAPI.Legal.Models.Enums;

namespace VocareWebAPI.Legal.Models.Entities
{
    public class UserConsent
    {
        public Guid Id { get; set; }
        public Guid LegalDocumentId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public DateTime AcceptedAt { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public ConsentSource ConsentSource { get; set; }

        // Relations
        public virtual User User { get; set; } = null!;
        public virtual LegalDocument LegalDocument { get; set; } = null!;
    }
}
