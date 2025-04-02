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
        public int DemandLevel { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
