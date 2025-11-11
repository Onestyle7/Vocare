using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Billing.Models.Dtos;

namespace VocareWebAPI.Billing.Services.Interfaces
{
    public interface IStripeService
    {
        Task<string> CreateCustomerAsync(string userId, string email);
        Task<string> CreateCheckoutSessionForTokenAsync(string userId, string priceId);
        Task<string> CreateCheckoutSessionForSubscriptionAsync(string userId, string priceId);
        Task<string> CreateCustomerPortalSessionAsync(string userId, string returnUrl);
        Task<List<PaymentHistoryDto>> GetPaymentHistoryAsync(string userId, int limit = 50);
    }
}
