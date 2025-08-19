using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Dtos
{
    public class GoogleVerifyRequest
    {
        public string AccessToken { get; set; } = string.Empty;
    }
}
