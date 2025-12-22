using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using AutoMapper.Internal.Mappers;

namespace VocareWebAPI.CareerAdvisor.Models.Dtos.MarketAnalysis
{
    public class EntryDifficultyDto
    {
        [JsonPropertyName("difficultyScore")]
        public int DifficultyScore { get; set; }

        [JsonPropertyName("difficultyLevel")]
        public string DifficultyLevel { get; set; }

        [JsonPropertyName("missingSkillsCount")]
        public int MissingSkillsCount { get; set; }

        [JsonPropertyName("missingSkills")]
        public List<string> MissingSkills { get; set; }

        [JsonPropertyName("matchingSkillsCount")]
        public int MatchingSkillsCount { get; set; }

        [JsonPropertyName("estimatedTimeToReady")]
        public string EstimatedTimeToReady { get; set; }

        [JsonPropertyName("explanation")]
        public string Explanation { get; set; }
    }
}
