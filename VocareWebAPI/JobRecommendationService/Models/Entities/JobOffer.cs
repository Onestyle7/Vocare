using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobRecommendationService.Models.Entities
{
    public class JobOffer
    {
        public string UserId { get; set; } = ""; // Identyfikator użytkownika
        public Guid Id { get; set; } // Unikalny identyfikator oferty pracy

        [ForeignKey("AiRecommendation")]
        public Guid AiRecommendationId { get; set; } // Identyfikator rekomendacji AI
        public string Company { get; set; } = ""; // Nazwa firmy
        public string Position { get; set; } = ""; // Stanowisko
        public string ApplicationLink { get; set; } = ""; // Link do aplikacji
        public string SalaryRange { get; set; } = ""; // Zakres wynagrodzenia
        public string Location { get; set; } = ""; // Lokalizacja pracy

        [Range(0, 100)]
        public int MatchScore { get; set; } = 0; // Wynik dopasowania
        public string Source { get; set; } = ""; // Źródło oferty
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Data utworzenia oferty
    }
}
