using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class LanguageEntryDto
    {
        [Required(ErrorMessage = "Nazwa języka jest wymagana.")]
        public string Language { get; set; } = String.Empty;

        public string? Level { get; set; } // np. B2, C1, native
    }
}
