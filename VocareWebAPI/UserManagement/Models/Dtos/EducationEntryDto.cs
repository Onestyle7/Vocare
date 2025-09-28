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
        public string Institution { get; set; } = string.Empty;

        public string Degree { get; set; } = string.Empty;

        public string Field { get; set; } = string.Empty;

        public string StartDate { get; set; } = string.Empty;

        public string EndDate { get; set; } = string.Empty;
    }
}
