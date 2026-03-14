using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VocareWebAPI.RoadmapService.Models.Enums;

namespace VocareWebAPI.RoadmapService.Models.Entities
{
    public class RoadmapStep
    {
        [Key]
        public Guid Id { get; set; }

        // Przynależność do fazy
        public Guid PhaseId { get; set; }

        [ForeignKey("PhaseId")]
        public RoadmapPhase Phase { get; set; } = default!;

        // Drzewiasta struktura
        public Guid? ParentStepId { get; set; }

        [ForeignKey("ParentStepId")]
        public RoadmapStep? ParentStep { get; set; }
        public List<RoadmapStep> ChildSteps { get; set; } = new();

        // Treść
        public string Title { get; set; } = String.Empty;
        public string Subtitle { get; set; } = String.Empty;
        public string? Description { get; set; }
        public List<string> Topics { get; set; } = new(); // zagadnienia do zrealizowania

        //Typ i status
        public StepType StepType { get; set; } = StepType.Required;
        public StepStatus Status { get; set; } = StepStatus.NotStarted;

        //Poyzcja (dla układania kafelków na froncie)
        public double? PositionX { get; set; }
        public double? PositionY { get; set; }
        public int OrderIndex { get; set; } // kolejnosc w ramach tego samego rodzica
    }
}
