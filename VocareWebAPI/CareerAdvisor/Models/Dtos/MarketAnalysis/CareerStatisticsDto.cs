using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos.MarketAnalysis
{
    /// <summary>
    /// DTO reprezentujące statystyki dla konkretnej ścieżki zawodowej
    /// </summary>
    public class CareerStatisticsDto
    {
        public string CareerName { get; set; } = string.Empty;
        public decimal AverageSalary { get; set; } = 0;
        public int EmploymentRate { get; set; } = 0;
        public string GrowthForecast { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
