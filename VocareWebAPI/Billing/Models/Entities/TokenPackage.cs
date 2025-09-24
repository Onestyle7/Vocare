using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Billing.Models.Entities
{
    public class TokenPackage
    {
        public string PriceId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int TokenAmount { get; set; }
        public decimal Price { get; set; }
        public string Currency { get; set; } = "pln";
    }
}
