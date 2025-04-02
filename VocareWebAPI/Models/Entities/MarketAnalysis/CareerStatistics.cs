using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Entities.MarketAnalysis
{
    public class CareerStatistics
    {
        [Key]
        public Guid Id { get; set; }
        public string CareerName { get; set; }
        public decimal AverageSalary { get; set; }
        public int EmploymentRate { get; set; }
        public string GrowthForecast { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
