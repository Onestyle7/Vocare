using Microsoft.AspNetCore.SignalR.Protocol;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.UserManagement.Repositories.Interfaces;

namespace VocareWebAPI.UserManagement.Repositories.Implementations;

public class AccountAntiAbuseRepository(AppDbContext context) : IAccountAntiAbuseReporitory
{
    private readonly AppDbContext _context = context;

    public async Task<bool> HasPriorBonusAsync(string emailHash)
    {
        return await _context.AccountAntiAbuseRegistries.AnyAsync(r =>
            r.EmailHash == emailHash && r.HadWelcomeBonus
        );
    }

    public async Task<AccountAntiAbuseRegistry?> GetByEmailHashAsync(string emailHash)
    {
        return await _context
            .AccountAntiAbuseRegistries.AsNoTracking()
            .FirstOrDefaultAsync(r => r.EmailHash == emailHash);
    }
}
