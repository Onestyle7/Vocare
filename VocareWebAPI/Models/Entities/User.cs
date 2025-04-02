using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace VocareWebAPI.Models.Entities
{
    public class User : IdentityUser
    {
        public UserProfile UserProfile { get; set; }
    }
}
