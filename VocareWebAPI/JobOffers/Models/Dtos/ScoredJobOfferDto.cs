using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobOffers.Models.Dtos
{
    public class ScoredJobOfferDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = "";
        public string CompanyName { get; set; } = "";
        public string Url { get; set; } = "";
        public string Category { get; set; } = "";
        public string SeniorityLevel { get; set; } = "";
        public string BriefDescription { get; set; } = "";
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string? SalaryCurrency { get; set; }
        public List<string> Locations { get; set; } = new();
        public List<string> Skills { get; set; } = new();
        public DateTime PublishedAt { get; set; }

        /// <summary>
        /// Ogólny wynik dopasowania oferty pracy do rekomendowanej ścieżki kariery w skali 0-100
        /// </summary>
        public int MatchScore { get; set; }

        /// <summary>
        /// Poziom pewności dopasowania: "low", "medium", "high"
        /// </summary>
        public string ConfidenceLevel { get; set; } = "medium";

        /// <summary>
        /// Szczegóły dopasowania oferty pracy do rekomendowanej ścieżki kariery
        /// </summary>
        public MatchDetailsDto MatchDetails { get; set; } = new();
    }
}
