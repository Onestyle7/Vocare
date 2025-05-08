using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Billing.Models.Dtos
{
    public class CreateCheckoutSessionRequestDto
    {
        public required string PriceId { get; set; }
    }
}
