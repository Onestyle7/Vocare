using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Entities.MarketAnalysis
{
    /// <summary>
    /// Encja reprezentująca trendy rynkowe w kontekście rekomendacji
    /// </summary>
    public class MarketTrends
    {
        [Key]
        public Guid Id { get; set; }
        public string TrendName { get; set; }
        public string Description { get; set; }
        public string Impact { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public Guid AiRecommendationId { get; set; } // Klucz obcy do AiRecommendation
    }
}
