using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.RoadmapService.Models.Dtos
{
    public class RoadmapGenerationRequest
    {
        public string CareerPathName { get; set; }
        public List<string> RequiredSkills { get; set; }
        public List<string> UserSkills { get; set; }
        public string SuggestedSeniority { get; set; }
        public int TimeHorizonMonths { get; set; }
    }
}
