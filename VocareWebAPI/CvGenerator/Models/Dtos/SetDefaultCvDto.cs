using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class SetDefaultCvDto
    {
        [Required]
        public Guid CvId { get; set; }
    }
}
