using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Entities
{
    public class LanguageEntry
    {
        [Key]
        public int Id { get; set; }
        public string? Language { get; set; } = String.Empty;
        public string Level { get; set; } = string.Empty;
    }
}
