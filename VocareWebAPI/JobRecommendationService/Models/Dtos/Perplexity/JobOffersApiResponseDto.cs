using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VocareWebAPI.JobRecommendationService.Models.Dtos.Perplexity
{
    public class JobOffersApiResponseDto
    {
        [JsonPropertyName("jobOffers")]
        public List<JobOfferApiDto> JobOffers { get; set; } = new();
    }
}
