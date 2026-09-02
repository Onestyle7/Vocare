using VocareWebAPI.Legal.Exceptions;
using VocareWebAPI.Legal.Models.Dtos;
using VocareWebAPI.Legal.Models.Entities;
using VocareWebAPI.Legal.Models.Enums;
using VocareWebAPI.Legal.Repositories.Interfaces;
using VocareWebAPI.Legal.Services.Interfaces;

namespace VocareWebAPI.Legal.Services.Implementations
{
    public class LegalService(ILegalRepository repository) : ILegalService
    {
        private readonly ILegalRepository _repository = repository;

        public async Task<bool> HasValidConsentsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return false;
            }

            var activeDocuments = await _repository.GetActiveDocumentsAsync();
            if (activeDocuments.Count == 0)
            {
                return true;
            }

            var acceptedDocumentIds = await _repository.GetAcceptedDocumentIdsAsync(userId);
            var acceptedSet = new HashSet<Guid>(acceptedDocumentIds);

            return activeDocuments.All(doc => acceptedSet.Contains(doc.Id));
        }

        public async Task<List<PendingDocumentDto>> GetPendingDocumentsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return [];
            }

            var activeDocuments = await _repository.GetActiveDocumentsAsync();
            if (activeDocuments.Count == 0)
            {
                return [];
            }

            var acceptedDocumentIds = await _repository.GetAcceptedDocumentIdsAsync(userId);
            var acceptedSet = new HashSet<Guid>(acceptedDocumentIds);

            return activeDocuments
                .Where(doc => !acceptedSet.Contains(doc.Id))
                .Select(doc => new PendingDocumentDto
                {
                    Id = doc.Id,
                    Type = doc.Type,
                    Version = doc.Version,
                    ContentPath = doc.ContentPath,
                    ValidFrom = doc.ValidFrom,
                    CreatedAt = doc.CreatedAt
                })
                .ToList();
        }

        public async Task AcceptConsentsAsync(
            string userId,
            List<Guid> documentIds,
            string ipAddress,
            string userAgent,
            ConsentSource consentSource)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("UserId cannot be null or empty.", nameof(userId));
            }

            if (documentIds == null || documentIds.Count == 0)
            {
                throw new EmptyConsentDocumentsException();
            }

            var activeDocuments = await _repository.GetActiveDocumentsAsync();
            var activeDocumentIds = activeDocuments.Select(d => d.Id).ToHashSet();

            foreach (var docId in documentIds)
            {
                if (!activeDocumentIds.Contains(docId))
                {
                    throw new LegalDocumentNotFoundException(docId);
                }
            }

            var distinctDocumentIds = documentIds.Distinct().ToList();
            var now = DateTime.UtcNow;

            var userConsents = distinctDocumentIds.Select(docId => new UserConsent
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                LegalDocumentId = docId,
                AcceptedAt = now,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                ConsentSource = consentSource
            }).ToList();

            await _repository.AddConsentsAsync(userConsents);
        }
    }
}
