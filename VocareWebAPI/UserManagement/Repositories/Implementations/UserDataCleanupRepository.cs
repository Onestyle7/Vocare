using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Repositories.Interfaces;

namespace VocareWebAPI.UserManagement.Repositories.Implementations;

public class UserDataCleanupRepository(
    AppDbContext dbContext,
    ILogger<UserDataCleanupRepository> logger
) : IUserDataCleanupRepository
{
    private readonly AppDbContext _dbContext = dbContext;
    private readonly ILogger<UserDataCleanupRepository> _logger = logger;

    public async Task PurgeUserDataAsync(User user, string emailHash)
    {
        await using var trx = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            await _dbContext.UserProfiles.Where(p => p.UserId == user.Id).ExecuteDeleteAsync();

            await _dbContext.GeneratedCvs.Where(c => c.UserId == user.Id).ExecuteDeleteAsync();

            await _dbContext.Roadmaps.Where(c => c.UserId == user.Id).ExecuteDeleteAsync();

            await _dbContext.Notifications.Where(c => c.UserId == user.Id).ExecuteDeleteAsync();

            await _dbContext.CvParseHistories.Where(c => c.UserId == user.Id).ExecuteDeleteAsync();

            await _dbContext.ProfileAttributes.Where(c => c.UserId == user.Id).ExecuteDeleteAsync();

            await _dbContext.MarketingConsents.Where(c => c.UserId == user.Id).ExecuteDeleteAsync();

            await _dbContext.UserLogins.Where(l => l.UserId == user.Id).ExecuteDeleteAsync();

            await _dbContext.UserTokens.Where(t => t.UserId == user.Id).ExecuteDeleteAsync();

            await _dbContext.UserRoles.Where(r => r.UserId == user.Id).ExecuteDeleteAsync();

            await _dbContext.UserClaims.Where(c => c.UserId == user.Id).ExecuteDeleteAsync();

            var hadWelcomeBonus = await _dbContext.TokenTransactions.AnyAsync(t =>
                t.UserId == user.Id && t.Type == TransactionType.WelcomeBonus
            );

            var existingRegistry = await _dbContext.AccountAntiAbuseRegistries.FirstOrDefaultAsync(
                r => r.EmailHash == emailHash
            );
            if (existingRegistry is null)
            {
                await _dbContext.AccountAntiAbuseRegistries.AddAsync(
                    new AccountAntiAbuseRegistry
                    {
                        EmailHash = emailHash,
                        UserId = user.Id,
                        HadWelcomeBonus = hadWelcomeBonus,
                        CreatedAt = DateTime.UtcNow,
                    }
                );
            }
            else
            {
                existingRegistry.UserId = user.Id;
                existingRegistry.CreatedAt = DateTime.UtcNow;
                existingRegistry.HadWelcomeBonus |= hadWelcomeBonus;
            }

            _dbContext.Users.Update(user);

            await _dbContext.SaveChangesAsync();
            await trx.CommitAsync();
        }
        catch
        {
            await trx.RollbackAsync();
            throw;
        }
    }
}
