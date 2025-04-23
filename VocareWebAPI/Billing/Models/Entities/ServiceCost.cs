using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Billing.Models.Entities
{
    public class ServiceCost
    {
        public int Id { get; set; } // Klucz główny
        public string ServiceName { get; set; }
        public int TokenCost { get; set; }
    }
}
