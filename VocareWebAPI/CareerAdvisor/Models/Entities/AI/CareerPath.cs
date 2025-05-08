using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.Models.Entities
{
    /// <summary>
    /// Encja pojedyńczej ścieżki zawodowej w ramach rekomendacji
    /// </summary>
    public class CareerPath
    {
        [Key]
        public Guid Id { get; set; }
        public string CareerName { get; set; } = String.Empty; // Nazwa ścieżki zawodowej, np. "Programista Python"
        public string Description { get; set; } = String.Empty; // Opis ścieżki zawodowej, np. "Programista Python zajmuje się tworzeniem aplikacji w języku Python"
        public string Probability { get; set; } = String.Empty; // Prawdopodobieństwo, np. "Wysokie", "Średnie", "Niskie"
        public List<string> RequiredSkills { get; set; } = new();
        public List<string> MarketAnalysis { get; set; } = new();
        public List<string> RecommendedCourses { get; set; } = new();
        public SwotAnalysis SwotAnalysis { get; set; } = default!; // Analiza SWOT dla danej ścieżki zawodowej

        public Guid? CareerStatisticsId { get; set; }

        [ForeignKey("CareerStatisticsId")]
        public CareerStatistics CareerStatistics { get; set; } = default!; // Statystyki dla danej ścieżki zawodowej
    }
}
