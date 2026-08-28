using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class TailorCvDto
    {
        [Required]
        public Guid CvId { get; set; }

        [Required]
        public string JobDescription { get; set; } = string.Empty;
    }
}
