using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Billing.Models.Dtos
{
    public class CancelSubscriptionRequestDto
    {
        public required string SubscriptionId { get; set; }
    }
}
