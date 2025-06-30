using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class UpdateCvDto
    {
        [Required]
        public Guid Id { get; set; }

        [Required(ErrorMessage = "Nazwa CV jest wymagana.")]
        [StringLength(100, ErrorMessage = "Nazwa CV nie może przekraczać 100 znaków.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Stanowisko nie może przekraczać 100 znaków.")]
        public string? TargetPosition { get; set; }

        [Required(ErrorMessage = "Dane CV są wymagane.")]
        public CvDto CvData { get; set; } = new();

        [StringLength(500, ErrorMessage = "Notatki nie mogą przekraczać 500 znaków.")]
        public string? Notes { get; set; }
    }
}
