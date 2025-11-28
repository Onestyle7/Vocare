using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VocareWebAPI.CareerAdvisor.Models.Dtos.MarketAnalysis
{
    public class SalaryProgressionDto
    {
        [JsonPropertyName("careerLevel")]
        public string CareerLevel { get; set; }

        [JsonPropertyName("yearsOfExperience")]
        public string YearsOfExperience { get; set; }

        [JsonPropertyName("minSalary")]
        public int MinSalary { get; set; }

        [JsonPropertyName("maxSalary")]
        public int MaxSalary { get; set; }

        [JsonPropertyName("averageSalary")]
        public int AverageSalary { get; set; }
    }
}
