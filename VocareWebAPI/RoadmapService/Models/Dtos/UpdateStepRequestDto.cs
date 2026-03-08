using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.RoadmapService.Models.Enums;

namespace VocareWebAPI.RoadmapService.Models.Dtos
{
    public class UpdateStepRequestDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public List<string>? Topics { get; set; }
        public StepType? StepType { get; set; }
    }
}
