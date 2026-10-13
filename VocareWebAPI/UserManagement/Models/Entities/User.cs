using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Legal.Models.Entities;

namespace VocareWebAPI.Models.Entities
{
    /// <summary>
    /// Encja reprezentująca użytkownika w systemie, rozszerzająca IdentityUser
    /// </summary>
    public class User : IdentityUser
    {
        public UserProfile UserProfile { get; set; } = default!;
        public UserBilling Billing { get; set; } = default!;
        public MarketingConsent? marketingConsent { get; set; }

        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public virtual ICollection<UserConsent> UserConsents { get; set; } = [];
    }
}
