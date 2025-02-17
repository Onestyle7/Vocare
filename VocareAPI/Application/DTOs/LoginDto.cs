using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareAPI.Application.DTOs
{
    public class LoginDto
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
     }
}