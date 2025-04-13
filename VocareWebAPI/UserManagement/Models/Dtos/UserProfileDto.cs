using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.UserManagement.Models.Enums;

namespace VocareWebAPI.Models.Dtos
{
    /// <summary>
    /// Dto reprezentujące dane profilu użytkownika
    /// </summary>
    public class UserProfileDto
    {
        [Required(ErrorMessage = "Imię jest wymagane.")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Nazwisko jest wymagane.")]
        public string LastName { get; set; }

        [Required(ErrorMessage = "Kraj jest wymagany.")]
        public string Country { get; set; }

        [Required(ErrorMessage = "Adres jest wymagany.")]
        public string Address { get; set; }

        [Required(ErrorMessage = "Numer telefonu jest wymagany.")]
        [Phone(ErrorMessage = "Niepoprawny numer telefonu.")]
        public string? PhoneNumber { get; set; }

        [Required(ErrorMessage = "Wykształcenie jest wymagane.")]
        public string Education { get; set; }
        public string? AdditionalInformation { get; set; }
        public string? AboutMe { get; set; }

        [Required(ErrorMessage = "Typ osobowości jest wymagany.")]
        [Range(
            1,
            17,
            ErrorMessage = "Typ osobowości musi być liczbą od 1 do 17. Gdzie 17 = nie wiem"
        )]
        public PersonalityType? PersonalityType { get; set; }

        public List<string>? WorkExperience { get; set; }
        public List<string>? Skills { get; set; }
        public List<string>? Certificates { get; set; }
        public List<string>? Languages { get; set; }
    }
}
