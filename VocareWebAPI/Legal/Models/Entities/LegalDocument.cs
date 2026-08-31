using VocareWebAPI.Legal.Models.Enums;

namespace VocareWebAPI.Legal.Models.Entities
{
    public class LegalDocument
    {
        public Guid Id { get; set; }
        public LegalDocumentType Type { get; set; }
        public bool IsActive { get; set; }
        public string Version { get; set; } = string.Empty;
        public string ContentPath { get; set; } = string.Empty;
        public DateTime ValidFrom { get; set; }
        public DateTime CreatedAt { get; set; }

        // Relations
        public virtual ICollection<UserConsent> UserConsents { get; set; } = [];
    }
}
