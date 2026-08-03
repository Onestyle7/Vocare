namespace VocareWebAPI.JobOffers.Configuration
{
    public class JobOfferSyncSettings
    {
        /// <summary>
        /// Nazwa sekcji w appsettings
        /// </summary>
        public const string SectionName = "JobOfferSync";

        /// <summary>
        /// Czy automatyczna synchronizacja jest włączona
        /// </summary>
        public bool EnableAutoSync { get; set; }
        public int SyncIntervalHours { get; set; } = 24;
        public int SyncIntervalMinutes { get; set; }
        public bool GenerateEmbeddingsOnSync { get; set; } = true;
    }
}
