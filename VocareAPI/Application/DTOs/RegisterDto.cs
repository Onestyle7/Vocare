using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareAPI.Application.DTOs
{
    public class RegisterDto
    {

        public required string Email { get; set; }
        public required string Password { get; set; }
    }
}