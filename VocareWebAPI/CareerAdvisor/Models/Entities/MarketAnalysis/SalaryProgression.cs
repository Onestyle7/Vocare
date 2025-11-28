using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.CareerAdvisor.Models.Entities.MarketAnalysis
{
    public class SalaryProgression
    {
        [Key]
        public Guid Id { get; set; }
        public string CareerLevel { get; set; } = string.Empty;
        public string YearsOfExperience { get; set; } = string.Empty;
        public int MinSalary { get; set; }
        public int MaxSalary { get; set; }
        public int AverageSalary { get; set; }
        public Guid CareerStatisticsId { get; set; }

        [ForeignKey("CareerStatisticsId")]
        public CareerStatistics CareerStatistics { get; set; } = default!;
    }
}
