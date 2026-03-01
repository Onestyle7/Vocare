using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Roadmap.Models.Enums;

namespace VocareWebAPI.Roadmap.Models.Entities
{
    public class Roadmap
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string userId { get; set; } = default!;

        [ForeignKey("UserId")]
        public User User { get; set; } = default!;

        // Powiązanie z rekomendacją i ścieżką
        public Guid CareerPathId { get; set; } = default!;

        [ForeignKey("CareerPathId")]
        public CareerPath CareerPath { get; set; } = default!;

        // Metadane
        public string Title { get; set; } = String.Empty;
        public int TimeHorizontMonths { get; set; } // 3-24
        public RoadmapStatus Status { get; set; } = RoadmapStatus.Draft;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        //Fazy
        public List<RoadmapPhase> Phases { get; set; } = new();
    }
}
