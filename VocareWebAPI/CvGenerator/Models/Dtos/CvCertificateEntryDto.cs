using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class CvCertificateEntryDto
    {
        public string Name { get; set; }
        public string? Date { get; set; } // Format: YYYY-MM-DD | null
    }
}
