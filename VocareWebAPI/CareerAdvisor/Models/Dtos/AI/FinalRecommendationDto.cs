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
        public string PrimaryPath { get; set; }

        [JsonPropertyName("justification")]
        public string Justification { get; set; }

        [JsonPropertyName("nextSteps")]
        public List<string> NextSteps { get; set; }

        [JsonPropertyName("longTermGoal")]
        public string LongTermGoal { get; set; }
    }
}
