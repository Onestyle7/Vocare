using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
    }
}
