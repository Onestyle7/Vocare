using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos
{
    /// <summary>
    /// DTO reprezentujące analizę SWOT dla ścieżki zawodowej
    /// </summary>
    public class SwotAnalysisDto
    {
        [JsonPropertyName("strengths")]
        public List<string> Strengths { get; set; } = new List<string>();

        [JsonPropertyName("weaknesses")]
        public List<string> Weaknesses { get; set; } = new List<string>();

        [JsonPropertyName("opportunities")]
        public List<string> Opportunities { get; set; } = new List<string>();

        [JsonPropertyName("threats")]
        public List<string> Threats { get; set; } = new List<string>();
    }
}
