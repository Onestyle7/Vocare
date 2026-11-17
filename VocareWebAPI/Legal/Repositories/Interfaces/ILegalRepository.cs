using VocareWebAPI.Legal.Models.Entities;

namespace VocareWebAPI.Legal.Repositories.Interfaces
{
    public interface ILegalRepository
    {
        Task<List<LegalDocument>> GetActiveDocumentsAsync();
        Task<List<Guid>> GetAcceptedDocumentIdsAsync(string userId);
        Task AddConsentsAsync(IEnumerable<UserConsent> consents);
        Task AddCookieConsentRecordAsync(CookieConsentRecord record);
        Task<int> DeleteCookieConsentRecordsOlderThanAsync(DateTime cutoffUtc);
    }
}
