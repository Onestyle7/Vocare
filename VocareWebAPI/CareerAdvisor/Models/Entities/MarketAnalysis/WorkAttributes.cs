using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.CareerAdvisor.Models.Entities.MarketAnalysis
{
    public class WorkAttributes
    {
        [Key]
        public Guid Id { get; set; }
        public int StressLevel { get; set; }
        public int AnalyticalThinking { get; set; }
        public int Creativity { get; set; }
        public int Teamwork { get; set; }
        public int Independence { get; set; }
        public int RoutineVsDynamic { get; set; }
        public int CustomerFacing { get; set; }
        public int TechnicalDepth { get; set; }

        public Guid CareerStatisticsId { get; set; }

        [ForeignKey("CareerStatisticsId")]
        public CareerStatistics CareerStatistics { get; set; } = default!;
    }
}
