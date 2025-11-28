using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VocareWebAPI.CareerAdvisor.Models.Dtos.MarketAnalysis
{
    public class AiNarratorDto
    {
        [JsonPropertyName("salaryInsight")]
        public string SalaryInsight { get; set; }

        [JsonPropertyName("workStyleInsight")]
        public string WorkStyleInsight { get; set; }

        [JsonPropertyName("entryAdvice")]
        public string EntryAdvice { get; set; }

        [JsonPropertyName("motivationalMessage")]
        public string MotivationalMessage { get; set; }

        [JsonPropertyName("personalizedRecommendation")]
        public string PersonalizedRecommendation { get; set; }
    }
}
