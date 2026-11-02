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

        /// <summary>
        /// Długość okresu próbnego dla użytkownika albo null, gdy trial jest wyłączony
        /// lub użytkownik miał już subskrypcję (jeden trial na konto).
        /// </summary>
        Task<int?> GetTrialDaysAsync(string userId);

        /// <summary>
        /// Trwający okres próbny użytkownika ze Stripe albo null, gdy subskrypcja nie jest w trialu.
        /// </summary>
        Task<TrialSummary?> GetTrialSummaryAsync(string userId);
        Task<string> CreateCustomerPortalSessionAsync(string userId);
        Task<List<PaymentHistoryDto>> GetPaymentHistoryAsync(string userId, int limit = 50);
    }
}
