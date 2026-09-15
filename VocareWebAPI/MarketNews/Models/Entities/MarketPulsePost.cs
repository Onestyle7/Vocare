using Microsoft.EntityFrameworkCore;

namespace VocareWebAPI.MarketNews.Models.Entities
{
    [Index(nameof(Slug), IsUnique = true)]
    public class MarketPulsePost
    {
        public Guid Id { get; set; }

        public string Slug { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int EstimatedReadingTime { get; set; }
        public DateTime PublishedAt { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public string Author { get; set; } = "Vocare";
        public string Category { get; set; } = "market-pulse";
        public string CoverImage { get; set; } = string.Empty;
        public string[] Tags { get; set; } = Array.Empty<string>();
    }
}
