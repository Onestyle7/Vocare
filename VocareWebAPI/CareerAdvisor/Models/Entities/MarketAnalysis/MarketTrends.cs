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
        public string TrendName { get; set; } = String.Empty; // Nazwa trendu, np. "Wzrost zapotrzebowania na programistów AI"
        public string Description { get; set; } = String.Empty; // Opis trendu, np. "Wzrost zapotrzebowania na specjalistów w dziedzinie sztucznej inteligencji"
        public string Impact { get; set; } = String.Empty; // Wpływ trendu na rynek pracy, np. "Wysoki", "Średni", "Niski"
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public Guid AiRecommendationId { get; set; } // Klucz obcy do AiRecommendation
        public AiRecommendation AiRecommendation { get; set; } = default!; // Nawiazanie do encji AiRecommendation
    }
}
