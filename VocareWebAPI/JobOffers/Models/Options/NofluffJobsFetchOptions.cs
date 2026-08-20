namespace VocareWebAPI.JobOffers.Models.Options
{
    public class NofluffJobsFetchOptions
    {
        public const string SectionName = "ExternalSources";
        public string NoFluffJobsfeed { get; set; } = "https://nofluffjobs.com/api/xml/jooble";
    }
}
