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
        public string Industry { get; set; }
        public string AverageSalary { get; set; }
        public string EmploymentRate { get; set; }
        public string GrowthForecast { get; set; }
    }
}
