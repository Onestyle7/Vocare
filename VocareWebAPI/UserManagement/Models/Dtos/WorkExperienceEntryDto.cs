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
        public string Company { get; set; }

        [Required(ErrorMessage = "Stanowisko jest wymagane.")]
        public string Position { get; set; }

        public string? Description { get; set; }

        public string? StartDate { get; set; } // Format: yyyy-MM-dd

        public string? EndDate { get; set; } // Format: yyyy-MM-dd lub "Obecnie"
    }
}
