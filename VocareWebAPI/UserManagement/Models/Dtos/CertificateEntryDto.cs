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
        public string Name { get; set; } = String.Empty;

        public string? Date { get; set; }

        public string? Issuer { get; set; }
    }
}
