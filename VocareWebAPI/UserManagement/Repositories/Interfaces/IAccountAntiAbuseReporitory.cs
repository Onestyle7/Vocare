using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.UserManagement.Repositories.Interfaces;

public interface IAccountAntiAbuseReporitory
{
    Task<bool> HasPriorBonusAsync(string emailHash);
    Task AddAsync(AccountAntiAbuseRegistry record);
}
