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
            // --- walidacja wejścia ---------------------------------------------------
            if (transaction is null)
                throw new ArgumentNullException(nameof(transaction), "Transaction cannot be null.");

            if (string.IsNullOrWhiteSpace(transaction.UserId))
                throw new ArgumentException(
                    "User ID cannot be null or empty.",
                    nameof(transaction.UserId)
                );

            // ustaw znacznik czasu, jeśli nie został podany
            if (transaction.CreatedAt == default)
                transaction.CreatedAt = DateTime.UtcNow;

            // --- zapis (bez lokalnej transakcji) ------------------------------------
            // Zakładamy, że ewentualną transakcją wyższego poziomu zarządza serwis domenowy.
            await _context.TokenTransactions.AddAsync(transaction);
            await _context.SaveChangesAsync();
        }
    }
}
