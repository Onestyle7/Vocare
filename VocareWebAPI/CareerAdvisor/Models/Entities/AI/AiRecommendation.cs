using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.Models
{
    /// <summary>
    /// Encja rekomendacji zawodowej, wygenerowanej przez AI dla zalogowanego użytkownika
    /// </summary>
    public class AiRecommendation
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string UserId { get; set; } = default!;

        [ForeignKey("UserId")]
        public UserProfile UserProfile { get; set; } = default!;
        public DateTime RecommendationDate { get; set; }
        public string PrimaryPath { get; set; } = String.Empty;
        public string Justification { get; set; } = String.Empty;
        public string LongTermGoal { get; set; } = String.Empty;
        public List<CareerPath> CareerPaths { get; set; } = new();
        public List<NextStep> NextSteps { get; set; } = new();
        public List<CareerStatistics> CareerStatistics { get; set; } = new();
        public List<SkillDemand> SkillDemands { get; set; } = new();
        public List<MarketTrends> MarketTrends { get; set; } = new();
        public List<AiRecommendation> Recommendations { get; set; } = new();
    }
}
