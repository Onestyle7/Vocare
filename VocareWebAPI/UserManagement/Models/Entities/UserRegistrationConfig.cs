using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.UserManagement.Models.Entities
{
    public class UserRegistrationConfig
    {
        public int WelcomeTokens { get; set; } = 40;
        public int DefaultSubscriptionStatus { get; set; } = 0;
        public int DefaultSubscriptionLevel { get; set; } = 0;
    }
}
