using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Billing.Models.Entities
{
    public class ServiceCost
    {
        public int Id { get; set; } // Klucz główny
        public required string ServiceName { get; set; } = string.Empty;
        public int TokenCost { get; set; }
    }
}
