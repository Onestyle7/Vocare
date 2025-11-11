using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Billing.Models.Entities
{
    public class MarketingConsent
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; } = default!;
        public bool IsConsentGiven { get; set; }
        public DateTime? ConsentDate { get; set; }
        public DateTime? ConsentWithdrawnDate { get; set; }
        public string? ConsentSource { get; set; }
        public string? IpAddress { get; set; }
        public string? ConsentText { get; set; }
    }
}
