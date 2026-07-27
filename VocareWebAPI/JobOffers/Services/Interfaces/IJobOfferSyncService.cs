using VocareWebAPI.JobOffers.Models.Dtos;
using VocareWebAPI.JobOffers.Models.Enums;

namespace VocareWebAPI.JobOffers.Services.Interfaces
{
    public interface IJobOfferSyncService
    {
        Task<SyncResult> SyncOffersAsync();
        Task<CleanupResult> CleanupStaleOffersAsync(JobOfferSource source);
        Task<BackfillResult> BackfillEmbeddingsAsync(int batchSize = 100);
    }

    public class BackfillResult
    {
        public int Processed { get; set; }
        public int Failed { get; set; }
        public int Remaining { get; set; }
    }

    public class SyncResult
    {
        public int Added { get; set; }
        public int Updated { get; set; }
        public int Failed { get; set; }
        public int Total { get; set; }
    }
}
