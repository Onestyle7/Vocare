using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.CareerAdvisor.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.Models.Entities.MarketAnalysis
{
    /// <summary>
    /// Encja reprezentująca statystyki dla konkretnej ścieżki zawodowej w ramach analizy rynku
    /// </summary>
    public class CareerStatistics
    {
        [Key]
        public Guid Id { get; set; }
        public string CareerName { get; set; } = String.Empty;
        public decimal AverageSalaryMin { get; set; }
        public decimal AverageSalaryMax { get; set; }
        public int EmploymentRate { get; set; }
        public string GrowthForecast { get; set; } = String.Empty;
        public DateTime LastUpdated { get; set; }
        public Guid AiRecommendationId { get; set; }
        public List<SalaryProgression> SalaryProgressions { get; set; } = new();
        public WorkAttributes? workAttributes { get; set; }
        public EntryDifficulty? EntryDifficulty { get; set; }
        public AiNarrator? AiNarrator { get; set; }
    }
}
