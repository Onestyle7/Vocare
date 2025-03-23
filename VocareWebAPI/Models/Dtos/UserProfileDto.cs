using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos
{
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
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Wykształcenie jest wymagane.")]
        public string Education { get; set; }

        public List<string>? WorkExperience { get; set; }
        public List<string>? Skills { get; set; }
        public List<string>? Certificates { get; set; }
        public List<string>? Languages { get; set; }
        public string? AdditionalInformation { get; set; }
        public string? AboutMe { get; set; }
        
    }
}
