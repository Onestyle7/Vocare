using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Billing.Models.Enums;

namespace VocareWebAPI.Billing.Models.Entities
{
    public class TokenTransaction
    {
        public int Id { get; set; } // Klucz główny
        public string UserId { get; set; }
        public string ServiceName { get; set; }
        public int Amount { get; set; }
        public TransactionType Type { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
