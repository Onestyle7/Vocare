using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.Models.Entities
{
    public class CareerPath
    {
        [Key]
        public Guid Id { get; set; }
        public string CareerName { get; set; }
        public string Description { get; set; }
        public string Probability { get; set; }
        public List<string> RequiredSkills { get; set; } = new();
        public List<string> MarketAnalysis { get; set; } = new();
        public List<string> RecommendedCourses { get; set; } = new();
        public SwotAnalysis SwotAnalysis { get; set; }

        //Relacja z CareerStatistics
        public Guid? CareerStatisticsId { get; set; }

        [ForeignKey("CareerStatisticsId")]
        public CareerStatistics CareerStatistics { get; set; }
    }
}
