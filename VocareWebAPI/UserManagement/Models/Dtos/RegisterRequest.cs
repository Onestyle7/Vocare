using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class RegisterRequest
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
}
