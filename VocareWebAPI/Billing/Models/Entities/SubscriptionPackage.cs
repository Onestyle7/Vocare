using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Billing.Models.Enums;

namespace VocareWebAPI.Billing.Models.Entities
{
    public class SubscriptionPackage
    {
        [Key]
        public string PriceId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Currency { get; set; } = "pln";
        public string Interval { get; set; } = "month";
        public int IntervalCount { get; set; } = 1;
        public SubscriptionLevel Level { get; set; } = SubscriptionLevel.Monthly;
        public bool IsActive { get; set; } = true;
    }
}
