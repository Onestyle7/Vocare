using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Repositories.Interfaces;

namespace VocareWebAPI.UserManagement.Repositories.Implementations;

public class UserDataCleanupRepository(AppDbContext dbContext, ILogger<UserDataCleanupRepository> logger) : IUserDataCleanupRepository
{
    private readonly AppDbContext _dbContext = dbContext;
    private readonly ILogger<UserDataCleanupRepository> _logger = logger;

    public async Task PurgeUserDataAsync(User user, string emailHash)
    {
        await using var trx = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            await _dbContext.UserProfiles
                .Where(p => p.UserId == user.Id)
                .ExecuteDeleteAsync();

            await _dbContext.GeneratedCvs
                .Where(c => c.UserId == user.Id)
                .ExecuteDeleteAsync();

            await _dbContext.Roadmaps
                .Where(c => c.UserId == user.Id)
                .ExecuteDeleteAsync();

            await _dbContext.Notifications
                .Where(c => c.UserId == user.Id)
                .ExecuteDeleteAsync();

            await _dbContext.CvParseHistories
                .Where(c => c.UserId == user.Id)
                .ExecuteDeleteAsync();

            await _dbContext.ProfileAttributes
                .Where(c => c.UserId == user.Id)
                .ExecuteDeleteAsync();

            await _dbContext.MarketingConsents
                .Where(c => c.UserId == user.Id)
                .ExecuteDeleteAsync();

            if (!await _dbContext.AccountAntiAbuseRegistries.AnyAsync(r => r.EmailHash == emailHash))
            {
                await _dbContext.AccountAntiAbuseRegistries.AddAsync(new AccountAntiAbuseRegistry
                {
                    EmailHash = emailHash,
                    HadWelcomeBonus = true,
                    CreatedAt = DateTime.UtcNow
                });
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
