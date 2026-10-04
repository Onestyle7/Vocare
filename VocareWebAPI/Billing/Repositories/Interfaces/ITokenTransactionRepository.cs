using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;

namespace VocareWebAPI.Billing.Repositories.Interfaces
{
    public interface ITokenTransactionRepository
    {
        Task AddTransactionAsync(TokenTransaction transaction);
        Task<bool> HasTransactionOfTypeAsync(string userId, TransactionType type);
    }
}
