namespace VocareWebAPI.JobOffers.Models.Dtos
{
    public class CleanupResult
    {
        public bool Skipped { get; set; }
        public string? SkipReason { get; set; }
        public int RemovedCount { get; set; }
        public int FeedSize { get; set; }
        public int DbSize { get; set; }
    }
}
