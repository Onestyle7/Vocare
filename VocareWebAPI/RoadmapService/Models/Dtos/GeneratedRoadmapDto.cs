using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.RoadmapService.Models.Dtos
{
    public class GeneratedRoadmapDto
    {
        public string Title { get; set; }
        public bool IsAchievable { get; set; } // czy cel jest osiagalny w danym horyzoncie czasowym
        public string? FeasibilityNotes { get; set; } // info jeśli nie jest osiagalny
        public List<GeneratedPhaseDto> Phases { get; set; }
    }
}
