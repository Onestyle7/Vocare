using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareAPI.Application.DTOs
{
    public class RecommendationHistoryDto
    {
        public Guid Id { get; set; }
        public string RecommendationText { get; set; } = "";
        public DateTime GeneratedAt { get; set; }
    }
}