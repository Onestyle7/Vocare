using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Entities
{
    public class CareerPath
    {
        [Key]
        public Guid Id { get; set; }
        public string CareerName { get; set; }
        public string Description { get; set; }
        public string Propability { get; set; }
        public List<string> RequiredSkills { get; set; } = new();
        public List<string> MarketAnalysis { get; set; } = new();
        public List<string> RecommendedCourses { get; set; } = new();
        public SwotAnalysis SwotAnalysis { get; set; }
    }
}
