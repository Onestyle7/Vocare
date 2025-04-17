using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Billing.Services.Interfaces
{
    public interface IBillingService
    {
        Task<bool> CanAccessServiceAsync(string userId, string serviceName);
        Task DeductTokensForServiceAsync(string userId, string serviceName);
        Task HandleWebhookAsync(string json, string stripeSignature);
    }
}
