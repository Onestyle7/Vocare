using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.CareerAdvisor.Models.Entities.MarketAnalysis
{
    public class EntryDifficulty
    {
        [Key]
        public Guid Id { get; set; }
        public int DifficultyScore { get; set; }
        public string DifficultyLevel { get; set; } = string.Empty;
        public int MissingSkillsCount { get; set; }
        public List<string> MissingSkills { get; set; } = new();
        public int MatchingSkillsCount { get; set; }
        public string EstimatedTimeToReady { get; set; } = string.Empty;
        public string Explanation { get; set; } = string.Empty;

        public Guid CareerStatisticsId { get; set; }

        [ForeignKey("CareerStatisticsId")]
        public CareerStatistics CareerStatistics { get; set; } = default!;
    }
}
