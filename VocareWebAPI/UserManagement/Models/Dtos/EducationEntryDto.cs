using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class EducationEntryDto
    {
        [Required(ErrorMessage = "Nazwa instytucji jest wymagana.")]
        public string Institution { get; set; }

        public string? Degree { get; set; }

        public string? Field { get; set; }

        public string? StartDate { get; set; } // Format: yyyy-MM-dd

        public string? EndDate { get; set; } // Format: yyyy-MM-dd
    }
}
