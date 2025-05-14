using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class CvEducationEntryDto
    {
        public string? Institution { get; set; }
        public string? Degree { get; set; }
        public string? Field { get; set; }
        public string? StartDate { get; set; } // Format: YYYY-MM-DD
        public string? EndDate { get; set; } // Format: YYYY-MM-DD | "Present"
    }
}
