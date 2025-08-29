using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VocareWebAPI.JobRecommendationService.Models.Dtos.JobRecommendations
{
    public class JobRecommendationsResponseDto
    {
        [JsonPropertyName("jobOffers")]
        public List<JobOfferDto> JobOffers { get; set; } = new();

        [JsonPropertyName("generatedAt")]
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("recommendationId")]
        public Guid RecommendationId { get; set; }

        [JsonPropertyName("totalCount")]
        public int TotalCount { get; set; }
    }
}
