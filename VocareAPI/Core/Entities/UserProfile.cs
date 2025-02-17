using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareAPI.Core.Entities
{
    public class UserProfile
    {
        [Required]
        public int Id { get; set; }
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = "";
        [Required]
        [MaxLength(50)]
        public string Surname { get; set; } = "";
        public string? PhoneNumber { get; set; }
        public string? Experience { get; set; }
        public string? Skills { get; set; }
        public string? Interests { get; set; }
        public string? Goals { get; set; }

        //Klucz obcy do User
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;


    }
}