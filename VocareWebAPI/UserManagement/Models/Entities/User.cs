using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace VocareWebAPI.Models.Entities
{
    /// <summary>
    /// Encja reprezentująca użytkownika w systemie, rozszerzająca IdentityUser
    /// </summary>
    public class User : IdentityUser
    {
        public UserProfile UserProfile { get; set; }
    }
}
