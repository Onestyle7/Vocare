using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class CvLanguageEntryDto
    {
        public string Language { get; set; } = string.Empty;
        public string Fluency { get; set; } = string.Empty;
    }
}
