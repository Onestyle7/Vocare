using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Data;

namespace VocareWebAPI.Billing.Repositories.Implementations
{
    public class UserBillingRepository : IUserBillingRepository
    {
        private readonly AppDbContext _context;

        public UserBillingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserBilling> GetByUserIdAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));
            }
            var userBilling = await _context
                .UserBillings.Where(ub => ub.UserId == userId)
                .FirstOrDefaultAsync();

            if (userBilling == null)
            {
                throw new KeyNotFoundException(
                    $"User billing information for user ID {userId} not found."
                );
            }
            return userBilling;
        }

        public async Task<UserBilling> CreateAsync(UserBilling userBilling)
        {
            // Sprawdzamy czy userBilling nie jest null i czy UserId nie jest pusty
            if (userBilling == null)
            {
                throw new ArgumentNullException(
                    nameof(userBilling),
                    "User billing information cannot be null."
                );
            }
            if (string.IsNullOrEmpty(userBilling.UserId))
            {
                throw new ArgumentException(
                    "User ID cannot be null or empty.",
                    nameof(userBilling.UserId)
                );
            }

            // Sprawdzamy czy istnieje już billing dla tego użytkownika
            // Jeśli istnieje, to rzucamy wyjątek
            var existingUserBilling = await _context
                .UserBillings.Where(ub => ub.UserId == userBilling.UserId)
                .FirstOrDefaultAsync();
            if (existingUserBilling != null)
            {
                throw new InvalidOperationException(
                    $"User billing information for user ID {userBilling.UserId} already exists."
                );
            }

            // Dodajemy nowy obiekt UserBilling do kontekstu i zapisujemy w bazie danych
            _context.UserBillings.Add(userBilling);
            await _context.SaveChangesAsync();
            return userBilling;
        }

        public async Task UpdateAsync(UserBilling userBilling)
        {
            // Sprawdzamy czy userBilling nie jest null i czy UserId nie jest pusty
            if (userBilling == null)
            {
                throw new ArgumentNullException(
                    nameof(userBilling),
                    "User billing information cannot be null."
                );
            }
            if (string.IsNullOrEmpty(userBilling.UserId))
            {
                throw new ArgumentException(
                    "User ID cannot be null or empty.",
                    nameof(userBilling.UserId)
                );
            }

            var existingUserBilling = await _context
                .UserBillings.Where(ub => ub.UserId == userBilling.UserId)
                .FirstOrDefaultAsync();
            if (existingUserBilling == null)
            {
                throw new InvalidOperationException(
                    $"User billing information for user ID {userBilling.UserId} does not exist."
                );
            }

            // Aktualizujemy istniejący obiekt UserBilling w kontekście
            _context.Entry(existingUserBilling).CurrentValues.SetValues(userBilling);

            // Zapisujemy zmiany w bazie danych
            await _context.SaveChangesAsync();
        }

        public async Task<bool> HasEnoughTokensAsync(string userId, int requiredTokens)
        {
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));
            }
            if (requiredTokens <= 0)
            {
                throw new ArgumentException(
                    "Required tokens must be greater than zero.",
                    nameof(requiredTokens)
                );
            }

            var userBilling = await _context
                .UserBillings.Where(ub => ub.UserId == userId)
                .Select(ub => new { ub.TokenBalance })
                .FirstOrDefaultAsync();

            if (userBilling == null)
            {
                throw new KeyNotFoundException(
                    $"User billing information for user ID {userId} not found."
                );
            }

            var hasEnoughTokens = userBilling.TokenBalance >= requiredTokens;
            return hasEnoughTokens;
        }

        public async Task DeductTokensAsync(string userId, int amount)
        {
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));
            }
            if (amount <= 0)
            {
                throw new ArgumentException("Amount must be greater than zero.", nameof(amount));
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var userBilling = await _context
                    .UserBillings.Where(ub => ub.UserId == userId)
                    .FirstOrDefaultAsync();

                if (userBilling == null)
                {
                    throw new KeyNotFoundException(
                        $"User billing information for user ID {userId} not found."
                    );
                }
                if (userBilling.TokenBalance < amount)
                {
                    throw new InvalidOperationException($"Not enough tokens for user ID {userId}.");
                }
                userBilling.TokenBalance -= amount;
                _context.UserBillings.Update(userBilling);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new Exception("Error while deducting tokens.", ex);
            }
        }

        public async Task AddTokensAsync(string userId, int amount)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            if (amount <= 0)
                throw new ArgumentException("Amount must be greater than zero.", nameof(amount));

            // pobierz rekord
            var userBilling = await _context.UserBillings.FirstOrDefaultAsync(ub =>
                ub.UserId == userId
            );

            if (userBilling is null)
                throw new KeyNotFoundException(
                    $"User billing information for user ID {userId} not found."
                );

            // aktualizuj saldo
            userBilling.TokenBalance += amount;
            userBilling.LastTokenPurchaseDate = DateTime.UtcNow;

            // pojedyncze SaveChanges – jeśli zewnętrzna transakcja istnieje, EF w niej zapisze
            await _context.SaveChangesAsync();
        }
    }
}
