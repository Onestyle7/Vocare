using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.CvGenerator.Models.Dtos
{
    public class CvDto
    {
        public CvBasicsDto Basics { get; set; } = new();
        public List<CvWorkEntryDto> Work { get; set; } = new();
        public List<CvEducationEntryDto> Education { get; set; } = new();
        public List<CvCertificateEntryDto> Certificates { get; set; } = new();
        public List<string> Skills { get; set; } = new();
        public List<CvLanguageEntryDto> Languages { get; set; } = new();
        public List<CvProjectDto> Projects { get; set; } = new();
        public List<CvSocialDto> Social { get; set; } = new();
    }
}
