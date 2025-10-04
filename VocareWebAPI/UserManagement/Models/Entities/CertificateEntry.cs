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
        public int Id { get; set; }
        public string Name { get; set; } = String.Empty;
        public DateTime? Date { get; set; }
        public string? Issuer { get; set; }
    }
}
