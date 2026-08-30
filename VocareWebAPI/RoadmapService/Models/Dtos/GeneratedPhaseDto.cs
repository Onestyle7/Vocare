using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.RoadmapService.Models.Dtos
{
    public class GeneratedPhaseDto
    {
        public string Title { get; set; }
        public int OrderIndex { get; set; }
        public List<GeneratedStepDto> Steps { get; set; }
        public int StartMonth { get; set; }
        public int EndMonth { get; set; }
    }
}
