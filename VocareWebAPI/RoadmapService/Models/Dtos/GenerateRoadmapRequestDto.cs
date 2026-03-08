using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.RoadmapService.Models.Dtos
{
    public class GenerateRoadmapRequestDto
    {
        public Guid CareerPathId { get; set; }
        public int TimeHorizonMonths { get; set; }
    }
}
