using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class CvWorkEntryDto
    {
        public string? Company { get; set; }
        public string? Position { get; set; }
        public string? StartDate { get; set; } // Format: YYYY-MM-DD
        public string? EndDate { get; set; } // Format: YYYY-MM-DD | "Present"
        public string? Description { get; set; }
    }
}
