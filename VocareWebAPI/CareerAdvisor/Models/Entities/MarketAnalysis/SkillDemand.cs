using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Entities.MarketAnalysis
{
    public class SkillDemand
    {
        [Key]
        public Guid Id { get; set; }
        public string SkillName { get; set; }
        public string Industry { get; set; }
        public string DemandLevel { get; set; }
        public DateTime LastUpdated { get; set; }
        public Guid AiRecommendationId { get; set; } // Klucz obcy do AiRecommendation
    }
}
