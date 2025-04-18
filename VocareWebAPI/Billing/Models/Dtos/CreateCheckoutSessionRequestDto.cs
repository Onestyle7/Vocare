using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Billing.Models.Dtos
{
    public class CreateCheckoutSessionRequestDto
    {
        public string PriceId { get; set; }
    }
}
