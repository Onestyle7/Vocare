using System.ComponentModel.DataAnnotations;

namespace VocareWebAPI.MarketNews.Models.Entities
{
    /// <summary>
    /// Encja reprezentująca newsy rynkowe.
    /// </summary>
    public class MarketNewsEntity
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = String.Empty;

        [Required]
        [MaxLength(10000)]
        public string Content { get; set; } = String.Empty;

        [Required]
        [MaxLength(150)]
        public string Summary { get; set; } = String.Empty;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
