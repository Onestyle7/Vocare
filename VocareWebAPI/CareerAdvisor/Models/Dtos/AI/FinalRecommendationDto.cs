using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos
{
    /// <summary>
    /// DTO reprezentujący końcową rekomendację zawodową
    /// </summary>
    public class FinalRecommendationDto
    {
        [JsonPropertyName("primaryPath")]
        public string PrimaryPath { get; set; } = string.Empty;

        [JsonPropertyName("justification")]
        public string Justification { get; set; } = string.Empty;

        [JsonPropertyName("nextSteps")]
        public List<string> NextSteps { get; set; } = new List<string>();

        [JsonPropertyName("longTermGoal")]
        public string LongTermGoal { get; set; } = string.Empty;
    }
}
