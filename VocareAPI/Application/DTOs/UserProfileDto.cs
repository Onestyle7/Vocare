using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using VocareAPI.Core.Entities;

namespace VocareAPI.Application.DTOs
{
    public class UserProfileDto
    {
        public string Name { get; set; } = "";
        public string Surname { get; set; } = "";
        public string? PhoneNumber { get; set; }
        public List<ExperienceEntryDto> Experience { get; set; } = new List<ExperienceEntryDto>();
        public List<SkillEntryDto> Skills { get; set; } = new List<SkillEntryDto>();
        public List<string> Interests { get; set; } = new List<string>();

    }
}