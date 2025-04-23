using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class CvDto
    {
        public CvBasicsDto? Basics { get; set; }
        public List<CvWorkEntryDto>? Work { get; set; }
        public List<CvEducationEntryDto>? Education { get; set; }
        public List<CvCertificateEntryDto>? Certificates { get; set; }
        public List<string>? Skills { get; set; }
        public List<CvLanguageEntryDto>? Languages { get; set; }
    }
}
