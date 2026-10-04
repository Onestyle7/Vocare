using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Exceptions;
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
    }
}
