using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.Models
{
    /// <summary>
    /// Encja rekomendacji zawodowej, wygenerowanej przez AI dla zalogowanego użytkownika
    /// </summary>
    public class AiRecommendation
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string UserId { get; set; }

        [ForeignKey("UserId")] // Relacaj 1;1
        public UserProfile UserProfile { get; set; } = new(); // Profil użytkownika, dla którego została wygenerowana rekomendacja
        public DateTime RecommendationDate { get; set; }
        public string PrimaryPath { get; set; } = String.Empty; // Główna ścieżka zawodowa, np. "Programista Python"
        public string Justification { get; set; } = String.Empty; // Uzasadnienie rekomendacji, np. "Wysokie zapotrzebowanie na rynku pracy"
        public string LongTermGoal { get; set; } = String.Empty; // Długoterminowy cel zawodowy, np. "Zostać ekspertem w dziedzinie AI"
        public List<CareerPath> CareerPaths { get; set; } = new();
        public List<NextStep> NextSteps { get; set; } = new();

        public List<MarketTrends> InfluencingTrends { get; set; } = new();
        public List<CareerStatistics> CareerStatistics { get; set; } = new();
        public List<SkillDemand> SkillDemands { get; set; } = new();
        public List<MarketTrends> MarketTrends { get; set; } = new();
    }
}
