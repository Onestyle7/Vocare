using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos
{
    /// <summary>
    /// DTO reprezentujące pojedyucza ścieżkę zawodowa |
    /// </summary>
    public class CareerPathDto
    {
        [JsonPropertyName("careerName")]
        public string CareerName { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("probability")]
        public double Probability { get; set; }

        [JsonPropertyName("requiredSkills")]
        public List<string> RequiredSkills { get; set; } = new List<string>();

        [JsonPropertyName("marketAnalysis")]
        public List<string> MarketAnalysis { get; set; } = new List<string>();

        [JsonPropertyName("recommendedCourses")]
        public List<string> RecommendedCourses { get; set; } = new List<string>();

        [JsonPropertyName("swot")]
        public SwotAnalysisDto SwotAnalysis { get; set; } = new SwotAnalysisDto();
    }
}
