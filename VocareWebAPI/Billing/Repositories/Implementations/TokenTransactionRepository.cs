using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Billing.Models.Entities;
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
            if (transaction == null)
            {
                throw new ArgumentNullException(nameof(transaction), "Transaction cannot be null.");
            }
            if (string.IsNullOrEmpty(transaction.UserId))
            {
                throw new ArgumentException(
                    "User ID cannot be null or empty.",
                    nameof(transaction.UserId)
                );
            }

            if (transaction.CreatedAt == default)
            {
                transaction.CreatedAt = DateTime.UtcNow;
            }

            var dbTransaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await _context.TokenTransactions.AddAsync(transaction);
                await _context.SaveChangesAsync();
                await dbTransaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await dbTransaction.RollbackAsync();
                throw new Exception("Error while adding transaction.", ex);
            }
        }
    }
}
