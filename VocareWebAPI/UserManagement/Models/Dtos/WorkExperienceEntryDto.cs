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
        public string Company { get; set; } = default!;

        [Required(ErrorMessage = "Stanowisko jest wymagane.")]
        public string Position { get; set; } = default!;
        public string Description { get; set; } = default!;
        public List<string>? Responsibilities { get; set; }

        public string? StartDate { get; set; }

        public string? EndDate { get; set; }
    }
}
