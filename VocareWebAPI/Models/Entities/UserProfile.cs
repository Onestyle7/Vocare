using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Entities
{
    public class UserProfile
    {
        [Key]
        public string UserId { get; set; }

        [ForeignKey("UserId")] // Relacaj 1;1
        public User User { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Country { get; set; }
        public string Address { get; set; }
        public string? PhoneNumber { get; set; }
        public string Education { get; set; }
        public List<string> WorkExperience { get; set; }
        public List<string> Skills { get; set; }
        public List<string> Certificates { get; set; }
        public List<string> Languages { get; set; }
        public string AdditionalInformation { get; set; }
        public string AboutMe { get; set; }

        public string LastRecommendationJson { get; set; } = "{}";
        public DateTime? LastRecommendationDate { get; set; }
        public string RecommendedCareerPath { get; set; } = "{}";
    }
}
