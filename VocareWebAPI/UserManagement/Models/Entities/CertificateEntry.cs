using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Entities
{
    public class CertificateEntry
    {
        [Key]
        public int Id { get; set; } // Identyfikator wpisu
        public string Name { get; set; } // Nazwa certyfikatu, np. Certyfikat Google
        public DateTime? Date { get; set; } // Data uzyskania certyfikatu
        public string? Issuer { get; set; } // Wydawca certyfikatu, np. Google
    }
}
