using VocareWebAPI.Billing.Models.Dtos;

namespace VocareWebAPI.Billing.Services.Interfaces
{
    public interface IConsentDiscountService
    {
        /// <summary>
        /// Przyznaje rabat za pierwszą zgodę marketingową. Zwraca rabat tylko gdy został
        /// przyznany teraz – ponowna zgoda po wycofaniu nie daje kolejnego rabatu.
        /// </summary>
        Task<ConsentDiscountInfo?> GrantAsync(string userId);

        /// <summary>
        /// Rabat do wykorzystania przy zakupie tokenów: przyznany, niewykorzystany i ważny.
        /// Nie zależy od aktualnego stanu zgody – wycofanie zgody nie odbiera rabatu
        /// (art. 7 ust. 3 RODO).
        /// </summary>
        Task<ConsentDiscountInfo?> GetActiveAsync(string userId);

        Task MarkRedeemedAsync(string userId);
    }
}
