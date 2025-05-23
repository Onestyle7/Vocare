using System.Text.Json.Serialization;

namespace VocareWebAPI.Models.Dtos
{
    /// <summary>
    /// DTO reprezentujące odpowiedź AI dotyczącą ścieżek zawodowych
    /// </summary>
    public class AiCareerResponseDto
    {
        [JsonPropertyName("careerPaths")]
        public List<CareerPathDto> CareerPaths { get; set; } = new List<CareerPathDto>();

        [JsonPropertyName("recommendation")]
        public FinalRecommendationDto Recommendation { get; set; } = new FinalRecommendationDto();
    }
}
