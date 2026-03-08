using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.RoadmapService.Models.Dtos
{
    public class StepPositionDto
    {
        public Guid StepId { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
    }
}
