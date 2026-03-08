using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.RoadmapService.Models.Dtos
{
    public class RoadmapListItemDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public int TimeHorizonMonths { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CareerPathName { get; set; }
        public double Progress { get; set; }
    }
}
