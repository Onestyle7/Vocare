using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class WorkExperienceEntryDto
    {
        [Required(ErrorMessage = "Nazwa firmy jest wymagana.")]
        public string Company { get; set; } = default!; // Nazwa firmy, np. Google

        [Required(ErrorMessage = "Stanowisko jest wymagane.")]
        public string Position { get; set; } = default!; // Stanowisko, np. Programista
        public string Description { get; set; } = default!; // Opis stanowiska, np. Pracowałem nad projektem X | Krótki opis obowiązków
        public List<string>? Responsibilities { get; set; }

        public string? StartDate { get; set; } // Format: yyyy-MM-dd

        public string? EndDate { get; set; } // Format: yyyy-MM-dd lub "Obecnie"
    }
}
