using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.CareerAdvisor.Models.Dtos.MarketAnalysis;

namespace VocareWebAPI.Models.Dtos.MarketAnalysis
{
    /// <summary>
    /// DTO reprezentujące statystyki dla konkretnej branży
    /// </summary>
    public class IndustryStatisticsDto
    {
        public string Industry { get; set; } = string.Empty;
        public int MinSalary { get; set; } = 0;
        public int MaxSalary { get; set; } = 0;
        public int EmploymentRate { get; set; } = 0;
        public string GrowthForecast { get; set; } = string.Empty;
        public List<SalaryProgressionDto> SalaryProgression { get; set; } = new();
        public WorkAttributesDto WorkAttributes { get; set; } = new();
        public EntryDifficultyDto EntryDifficulty { get; set; } = new();
        public AiNarratorDto AiNarrator { get; set; } = new();
    }
}
