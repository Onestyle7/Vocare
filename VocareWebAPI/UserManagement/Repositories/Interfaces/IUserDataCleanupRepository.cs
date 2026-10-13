using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.UserManagement.Repositories.Interfaces;

public interface IUserDataCleanupRepository
{
    Task PurgeUserDataAsync(User user, string emailHash);
}
