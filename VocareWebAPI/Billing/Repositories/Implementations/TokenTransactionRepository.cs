using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Constants;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Data;

namespace VocareWebAPI.Billing.Repositories.Implementations
{
    public class TokenTransactionRepository : ITokenTransactionRepository
    {
        private readonly AppDbContext _context;

        public TokenTransactionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddTransactionAsync(TokenTransaction transaction)
        {
            if (transaction is null)
                throw new ArgumentNullException(nameof(transaction), "Transaction cannot be null.");

            if (string.IsNullOrWhiteSpace(transaction.UserId))
                throw new ArgumentException(
                    "User ID cannot be null or empty.",
                    nameof(transaction.UserId)
                );

            if (transaction.CreatedAt == default)
                transaction.CreatedAt = DateTime.UtcNow;

            await _context.TokenTransactions.AddAsync(transaction);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> HasTransactionOfTypeAsync(string userId, TransactionType type)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            return await _context.TokenTransactions.AnyAsync(t =>
                t.UserId == userId && t.Type == type
            );
        }

        public async Task<bool> HasEverHadSubscriptionAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            return await _context.TokenTransactions.AnyAsync(t =>
                t.UserId == userId
                && t.Type == TransactionType.Purchase
                && t.ServiceName.StartsWith(TransactionServiceNames.SubscriptionActivatedPrefix)
            );
        }

        public async Task<DateTime?> GetFirstTransactionDateAsync(
            string userId,
            TransactionType type
        )
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            return await _context
                .TokenTransactions.Where(t => t.UserId == userId && t.Type == type)
                .OrderBy(t => t.CreatedAt)
                .Select(t => (DateTime?)t.CreatedAt)
                .FirstOrDefaultAsync();
        }
    }
}
