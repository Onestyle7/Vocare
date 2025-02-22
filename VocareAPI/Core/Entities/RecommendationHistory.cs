using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareAPI.Core.Entities
{
    public class RecommendationHistory
    {
        [Key]
        public Guid Id { get; set; }
        // Klucz obcy do User (użytkownika, dla którego rekomendacja została wygenerowana)
        [Required]
        public Guid UserId { get; set; }
        //Rekomendacja 
        [Required]
        public string RecommendationText { get; set; } = string.Empty;
        // Data wygenerowania rekomendacji - domyślnie ustawiona na aktualną datę
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }
}