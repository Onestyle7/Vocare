using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareAPI.Core.Entities
{
    public class UserProfile
    {
        [Required]
        public int Id { get; set; }
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = "";
        [Required]
        [MaxLength(50)]
        public string Surname { get; set; } = "";
        public string? PhoneNumber { get; set; }
        public List<ExperienceEntry> Experience { get; set; } = new List<ExperienceEntry>();
        public List<SkillEntry> Skills { get; set; } = new List<SkillEntry>();
        public string WorkEnvironmentPreference { get; set; } = "";
        public decimal? ExpectedSalary { get; set; }
        public int? WeeklyLearningAvailability { get; set; }
        public List<string> Interests { get; set; } = new List<string>();

        //Klucz obcy do User
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;


    }
}