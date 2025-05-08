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
        public required string UserId { get; set; } = string.Empty;
        public required string ServiceName { get; set; } = string.Empty;
        public int Amount { get; set; }
        public TransactionType Type { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
