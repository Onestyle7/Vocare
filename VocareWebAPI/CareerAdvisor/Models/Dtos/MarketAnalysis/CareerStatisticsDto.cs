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
        public string CareerName { get; set; }
        public decimal AverageSalary { get; set; }
        public int EmploymentRate { get; set; }
        public string GrowthForecast { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
