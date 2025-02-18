using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareAPI.Application.DTOs
{
    public class UserProfileDto
    {
        public string Name { get; set; } = "";
        public string Surname { get; set; } = "";
        public string? PhoneNumber { get; set; }
        public string? Experience { get; set; }
        public string? Skills { get; set; }
        public string? Interests { get; set; }
        public string? Goals { get; set; }

    }
}