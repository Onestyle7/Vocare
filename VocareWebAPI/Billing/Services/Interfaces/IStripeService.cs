using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Billing.Services.Interfaces
{
    public interface IStripeService
    {
        Task<string> CreateCustomerAsync(string userId, string email);
        Task<string> CreateCheckoutSessionForTokenAsync(string userId, string priceId);
        Task<string> CreateSubsriptionAsync(string userId, string priceId);
        Task CancelSubscriptionAsync(string subscriptionId);
    }
}
