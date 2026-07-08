using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.UserManagement.Models.Entities
{
    public class ProfileAttributes
    {
        public Guid Id { get; set; }

        public string UserId { get; set; } = default!;

        [ForeignKey("UserId")]
        public UserProfile UserProfile { get; set; } = default!;

        [Range(0, 100)]
        public int PracticalExperience { get; set; }

        [Range(0, 100)]
        public int HardCompetencies { get; set; }

        [Range(0, 100)]
        public int Creativity { get; set; }

        [Range(0, 100)]
        public int Teamwork { get; set; }

        [Range(0, 100)]
        public int Independence { get; set; }

        [Range(0, 100)]
        public int SoftCompetencies { get; set; }

        [Range(0, 100)]
        public int Certification { get; set; }

        [Range(0, 100)]
        public int TechnicalSkills { get; set; }
        public DateTime GeneratedAt { get; set; }
    }
}
