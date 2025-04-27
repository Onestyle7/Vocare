using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Entities
{
    public class LanguageEntry
    {
        [Key]
        public int Id { get; set; } // Identyfikator wpisu
        public string Language { get; set; } // Język, np. Angielski
        public string Level { get; set; } // Poziom, np. B2, C1, C2, native
    }
}
