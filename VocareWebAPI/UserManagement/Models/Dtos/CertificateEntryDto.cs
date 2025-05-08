using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class CertificateEntryDto
    {
        [Required(ErrorMessage = "Nazwa certyfikatu jest wymagana.")]
        public string Name { get; set; } = String.Empty; // Nazwa certyfikatu, np. Certyfikat Google

        public string? Date { get; set; } // Format: yyyy-MM-dd

        public string? Issuer { get; set; }
    }
}
