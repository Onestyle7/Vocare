using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.UserManagement.Models.Dtos;
using VocareWebAPI.UserManagement.Models.Enums;

namespace VocareWebAPI.Models.Dtos
{
    /// <summary>
    /// Dto reprezentujące dane profilu użytkownika
    /// </summary>
    public class UserProfileDto
    {
        [Required(ErrorMessage = "Imię jest wymagane.")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nazwisko jest wymagane.")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Kraj jest wymagany.")]
        public string Country { get; set; } = string.Empty;

        public string? Address { get; set; }

        [Phone(ErrorMessage = "Niepoprawny numer telefonu.")]
        public string? PhoneNumber { get; set; }

        public List<EducationEntryDto>? Education { get; set; }

        public List<WorkExperienceEntryDto>? WorkExperience { get; set; }

        public List<string>? Skills { get; set; }

        public List<CertificateEntryDto>? Certificates { get; set; }

        public List<LanguageEntryDto>? Languages { get; set; }

        public string? AdditionalInformation { get; set; }

        public string? AboutMe { get; set; }

        [Required(ErrorMessage = "Typ osobowości jest wymagany.")]
        [Range(
            1,
            17,
            ErrorMessage = "Typ osobowości musi być liczbą od 1 do 17. Gdzie 17 = nie wiem"
        )]
        public PersonalityType? PersonalityType { get; set; }
    }
}
