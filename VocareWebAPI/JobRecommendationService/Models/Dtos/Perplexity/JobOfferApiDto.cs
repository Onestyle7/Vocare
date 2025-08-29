using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VocareWebAPI.JobRecommendationService.Models.Dtos.Perplexity
{
    public class JobOfferApiDto
    {
        [JsonPropertyName("company")]
        public string Company { get; set; } = string.Empty;

        [JsonPropertyName("position")]
        public string Position { get; set; } = string.Empty;

        [JsonPropertyName("applicationLink")]
        public string ApplicationLink { get; set; } = string.Empty;

        [JsonPropertyName("salaryRange")]
        public string SalaryRange { get; set; } = string.Empty;

        [JsonPropertyName("location")]
        public string Location { get; set; } = string.Empty;

        [JsonPropertyName("matchScore")]
        public int MatchScore { get; set; }

        [JsonPropertyName("source")]
        public string Source { get; set; } = string.Empty;

        [JsonPropertyName("requirements")]
        public List<string> Requirements { get; set; } = new();
    }
}
