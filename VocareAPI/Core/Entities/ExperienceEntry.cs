using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareAPI.Core.Entities
{
    public class ExperienceEntry
    {
        public int Id { get; set; }
        public string Position { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public int YearsOfExperience { get; set; }
        public string Achievements { get; set; }
    }
}