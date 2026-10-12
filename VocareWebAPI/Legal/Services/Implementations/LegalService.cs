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

            return GetDocumentsToAccept(activeDocuments, acceptedDocumentIds).Count == 0;
        }

        public async Task<List<Guid>> GetCurrentDocumentIdsAsync()
        {
            var activeDocuments = await _repository.GetActiveDocumentsAsync();

            return activeDocuments
                .GroupBy(doc => doc.Type)
                .Select(group => group.MaxBy(doc => doc.ValidFrom)!.Id)
                .ToList();
        }

        /// <summary>
        /// For each document type: the required version is the latest one already in effect
        /// (ValidFrom &lt;= now), the newest is the latest published one – it may take effect in the
        /// future (terms § 18: it binds existing users only from ValidFrom).
        /// Consent is valid when the user accepted a version not older than the required one;
        /// otherwise the newest version has to be accepted.
        /// </summary>
        private static List<LegalDocument> GetDocumentsToAccept(
            List<LegalDocument> activeDocuments,
            List<Guid> acceptedDocumentIds
        )
        {
            var acceptedSet = acceptedDocumentIds.ToHashSet();
            var now = DateTime.UtcNow;
            var toAccept = new List<LegalDocument>();

            foreach (var versions in activeDocuments.GroupBy(doc => doc.Type))
            {
                var required = versions
                    .Where(doc => doc.ValidFrom <= now)
                    .MaxBy(doc => doc.ValidFrom);
                if (required == null)
                {
                    continue;
                }

                var hasValidConsent = versions.Any(doc =>
                    acceptedSet.Contains(doc.Id) && doc.ValidFrom >= required.ValidFrom
                );
                if (!hasValidConsent)
                {
                    toAccept.Add(versions.MaxBy(doc => doc.ValidFrom)!);
                }
            }

            return toAccept;
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

            return GetDocumentsToAccept(activeDocuments, acceptedDocumentIds)
                .Select(doc => new PendingDocumentDto
                {
                    Id = doc.Id,
                    Type = doc.Type,
                    Version = doc.Version,
                    ContentPath = doc.ContentPath,
                    ValidFrom = doc.ValidFrom,
                    CreatedAt = doc.CreatedAt,
                })
                .ToList();
        }

        public async Task AcceptConsentsAsync(
            string userId,
            List<Guid> documentIds,
            string ipAddress,
            string userAgent,
            ConsentSource consentSource
        )
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

            var userConsents = distinctDocumentIds
                .Select(docId => new UserConsent
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    LegalDocumentId = docId,
                    AcceptedAt = now,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    ConsentSource = consentSource,
                })
                .ToList();

            await _repository.AddConsentsAsync(userConsents);
        }
    }
}
