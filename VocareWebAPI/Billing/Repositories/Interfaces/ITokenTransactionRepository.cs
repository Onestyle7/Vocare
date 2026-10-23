using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;

namespace VocareWebAPI.Billing.Repositories.Interfaces
{
    public interface ITokenTransactionRepository
    {
        Task AddTransactionAsync(TokenTransaction transaction);
        Task<bool> HasTransactionOfTypeAsync(string userId, TransactionType type);
        Task<bool> HasEverHadSubscriptionAsync(string userId);

        /// <summary>Data pierwszej transakcji danego typu albo null, jeśli jej nie ma.</summary>
        Task<DateTime?> GetFirstTransactionDateAsync(string userId, TransactionType type);
    }
}
