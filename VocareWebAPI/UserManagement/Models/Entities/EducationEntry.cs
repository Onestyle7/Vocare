using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Entities
{
    public class EducationEntry
    {
        [Key]
        public int Id { get; set; } // Identyfikator wpisu
        public string Institution { get; set; } // Nazwa uczelni, np. Politechnika Wrocławska
        public string Degree { get; set; } // np. Licencjat, Magister, Doktor
        public string Field { get; set; } // Kierunek studiów, np. Informatyka
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}
