using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobRecommendationService.Models.Dtos.JobRecommendations
{
    public class JobOfferDto
    {
        public Guid Id { get; set; }
        public Guid AiRecommendationId { get; set; }
        public string Company { get; set; }
        public string Position { get; set; }
        public string ApplicationLink { get; set; }
        public string SalaryRange { get; set; }
        public string Location { get; set; }
        public int MathScore { get; set; }
        public string Source { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
