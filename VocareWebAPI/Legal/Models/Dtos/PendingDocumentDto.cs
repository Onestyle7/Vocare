using VocareWebAPI.Legal.Models.Enums;

namespace VocareWebAPI.Legal.Models.Dtos
{
    public class PendingDocumentDto
    {
        public Guid Id { get; set; }
        public LegalDocumentType Type { get; set; }
        public string Version { get; set; } = string.Empty;
        public string ContentPath { get; set; } = string.Empty;
        public DateTime ValidFrom { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
