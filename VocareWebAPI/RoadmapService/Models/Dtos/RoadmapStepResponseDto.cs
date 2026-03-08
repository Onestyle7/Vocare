using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.RoadmapService.Models.Dtos
{
    public class RoadmapStepResponseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public List<string> Topics { get; set; }
        public string StepType { get; set; }
        public string Status { get; set; }
        public int OrderIndex { get; set; }
        public Guid? ParentStepId { get; set; }
        public double? PositionX { get; set; }
        public double? PositionY { get; set; }
    }
}
