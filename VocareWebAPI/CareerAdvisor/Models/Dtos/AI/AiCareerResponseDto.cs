using System.Text.Json.Serialization;

namespace VocareWebAPI.Models.Dtos
{
    public class AiCareerResponseDto
    {
        [JsonPropertyName("careerPaths")]
        public List<CareerPathDto> CareerPaths { get; set; }

        [JsonPropertyName("recommendation")]
        public FinalRecommendationDto Recommendation { get; set; }
    }
}
