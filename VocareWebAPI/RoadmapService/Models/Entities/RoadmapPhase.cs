using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VocareWebAPI.RoadmapService.Models.Entities
{
    public class RoadmapPhase
    {
        [Key]
        public Guid Id { get; set; }
        public Guid RoadmapId { get; set; }

        [ForeignKey("RoadmapId")]
        public Roadmap Roadmap { get; set; } = default!;
        public string Title { get; set; } = String.Empty;
        public int OrderIndex { get; set; } // Określa kolejność fazy w ramach roadmapy
        public List<RoadmapStep> Steps { get; set; } = new();
        public int StartMonth { get; set; }
        public int EndMonth { get; set; }
    }
}
