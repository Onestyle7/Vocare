using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class CreateCvDto
    {
        [Required(ErrorMessage = "Nazwa CV jest wymagana.")]
        [StringLength(100, ErrorMessage = "Nazwa CV nie może przekraczać 100 znaków.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Stanowisko nie może przekraczać 100 znaków.")]
        public string? TargetPosition { get; set; }

        /// <summary>
        /// Czy utworzyć CV na podstawie profilu użytkownika
        /// </summary>
        public bool CreateFromProfile { get; set; } = true;

        /// <summary>
        /// Opcjonalne dane CV (jeśli CreateFromProfile jest false)
        /// </summary>
        public CvDto? InitialData { get; set; }

        [StringLength(500, ErrorMessage = "Notatki nie mogą przekraczać 500 znaków.")]
        public string? Notes { get; set; }
    }
}
