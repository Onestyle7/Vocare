using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VocareWebAPI.CareerAdvisor.Models.Dtos.MarketAnalysis
{
    public class WorkAttributesDto
    {
        [JsonPropertyName("stressLevel")]
        public int StressLevel { get; set; }

        [JsonPropertyName("analyticalThinking")]
        public int AnalyticalThinking { get; set; }

        [JsonPropertyName("creativity")]
        public int Creativity { get; set; }

        [JsonPropertyName("teamwork")]
        public int Teamwork { get; set; }

        [JsonPropertyName("independence")]
        public int Independence { get; set; }

        [JsonPropertyName("routineVsDynamic")]
        public int RoutineVsDynamic { get; set; }

        [JsonPropertyName("customerFacing")]
        public int CustomerFacing { get; set; }

        [JsonPropertyName("technicalDepth")]
        public int TechnicalDepth { get; set; }
    }
}
