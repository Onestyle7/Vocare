using VocareWebAPI.Legal.Models.Dtos;
using VocareWebAPI.Legal.Models.Enums;

namespace VocareWebAPI.Legal.Services.Interfaces
{
    public interface ILegalService
    {
        Task<bool> HasValidConsentsAsync(string userId);
        Task<List<PendingDocumentDto>> GetPendingDocumentsAsync(string userId);

        /// <summary>Newest active version of each document type – accepted at registration.</summary>
        Task<List<Guid>> GetCurrentDocumentIdsAsync();
        Task AcceptConsentsAsync(
            string userId,
            List<Guid> documentIds,
            string ipAddress,
            string userAgent,
            ConsentSource authSource
        );
    }
}
