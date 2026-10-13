using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Legal.Exceptions
{
    public class LegalDocumentNotFoundException : NotFoundException
    {
        public Guid DocumentId { get; }

        public LegalDocumentNotFoundException(Guid documentId)
            : base($"Legal document with ID '{documentId}' was not found.", "LEGAL_DOCUMENT_NOT_FOUND")
        {
            DocumentId = documentId;
        }
    }
}
