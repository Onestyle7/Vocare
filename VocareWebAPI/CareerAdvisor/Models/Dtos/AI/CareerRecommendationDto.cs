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
        public string CareerName { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("probability")]
        public double Probability { get; set; }

        [JsonPropertyName("requiredSkills")]
        public List<string> RequiredSkills { get; set; }

        [JsonPropertyName("marketAnalysis")]
        public List<string> MarketAnalysis { get; set; }

        [JsonPropertyName("recommendedCourses")]
        public List<string> RecommendedCourses { get; set; }

        [JsonPropertyName("swot")]
        public SwotAnalysisDto SwotAnalysis { get; set; }
    }
}
