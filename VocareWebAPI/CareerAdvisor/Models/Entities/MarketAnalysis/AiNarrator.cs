using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.CareerAdvisor.Models.Entities.MarketAnalysis
{
    public class AiNarrator
    {
        [Key]
        public Guid Id { get; set; }
        public string SalaryInsight { get; set; } = string.Empty;
        public string WorkStyleInsight { get; set; } = string.Empty;
        public string EntryAdvice { get; set; } = string.Empty;
        public string MotivationalMessage { get; set; } = string.Empty;
        public string PersonalizedRecommendation { get; set; } = string.Empty;

        public Guid CareerStatisticsId { get; set; }

        [ForeignKey("CareerStatisticsId")]
        public CareerStatistics CareerStatistics { get; set; } = default!;
    }
}
