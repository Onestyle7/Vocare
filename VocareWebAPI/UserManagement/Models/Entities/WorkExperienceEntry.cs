using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Entities
{
    public class WorkExperienceEntry
    {
        [Key]
        public int Id { get; set; } // Identyfikator wpisu
        public string Company { get; set; } // Nazwa firmy, np. Google
        public string Position { get; set; } // Stanowisko, np. Programista
        public string Description { get; set; } // Opis stanowiska, np. Pracowałem nad projektem X | Krótki opis obowiązków
        public DateTime? StartDate { get; set; } // Data rozpoczęcia pracy
        public DateTime? EndDate { get; set; } // Data zakończenia pracy
    }
}
