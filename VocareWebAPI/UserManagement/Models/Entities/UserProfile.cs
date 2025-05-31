using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.UserManagement.Models.Entities;
using VocareWebAPI.UserManagement.Models.Enums;

namespace VocareWebAPI.Models.Entities
{
    /// <summary>
    /// Encja reprezentująca profil użytkowniak w bazie danych
    /// </summary>
    public class UserProfile
    {
        [Key]
        public string UserId { get; set; } = default!; // Identyfikator użytkownika, klucz główny

        [ForeignKey("UserId")] // Relacaj 1;1
        public User User { get; set; } = default!; // Użytkownik, do którego należy profil
        public string FirstName { get; set; } = String.Empty; // Imię użytkownika
        public string LastName { get; set; } = String.Empty; // Nazwisko użytkownika
        public string Country { get; set; } = String.Empty; // Kraj użytkownika
        public string? Address { get; set; }
        public string? PhoneNumber { get; set; }
        public List<EducationEntry> Education { get; set; } = new();
        public List<WorkExperienceEntry> WorkExperience { get; set; } = new();
        public List<string> Skills { get; set; } = new(); //todo: dodać w przyszłości osobną encję do umiejętności
        public List<CertificateEntry> Certificates { get; set; } = new();
        public List<LanguageEntry> Languages { get; set; } = new();
        public string? AdditionalInformation { get; set; }
        public string? AboutMe { get; set; }
        public PersonalityType PersonalityType { get; set; } = PersonalityType.Unknown; // Typ osobowości użytkownika, domyślnie Unknown
        public List<AiRecommendation> Recommendations { get; set; } = new();
        public List<string> SoftSkills { get; set; } = new(); // Lista umiejętności miękkich użytkownika
    }
}
