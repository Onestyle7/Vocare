using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.RoadmapService.Models.Entities;

namespace VocareWebAPI.RoadmapService.Models.Dtos
{
    public class RoadmapResponseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public int TimeHorizonMonths { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string CareerPathName { get; set; }
        public double Progress { get; set; }
        public List<RoadmapPhaseResponseDto> Phases { get; set; }
    }
}
