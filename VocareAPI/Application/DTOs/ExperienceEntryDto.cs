using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareAPI.Application.DTOs
{
    public class ExperienceEntryDto
    {
        public string Position { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public int YearsOfExperience { get; set; }
        public string Achievements { get; set; }
    }
}