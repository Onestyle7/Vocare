using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using VocareWebAPI.CvGenerator.Models.Dtos;

namespace VocareWebAPI.CvGenerator.Models.Entities
{
    public class CvAnalysis
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid CvId { get; set; }

        [ForeignKey(nameof(CvId))]
        public GeneratedCv Cv { get; set; } = default!;

        public string ResultJson { get; set; } = string.Empty;

        public int CvVersionAtAnalysis { get; set; }

        public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
    }
}
