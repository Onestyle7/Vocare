using System.ComponentModel.DataAnnotations;
using Pgvector;

namespace VocareWebAPI.JobOffers.Models.Entities
{
    public class SkillEmbedding
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string NormalizedSkillName { get; set; } = ""; // unikalna wartosc
        public string OriginalName { get; set; } = ""; // Do debugowania
        public Vector? Embedding { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
