using VocareWebAPI.Shared.Results;

namespace VocareWebAPI.UserManagement.Services.Interfaces;

public interface IUserDeletionService
{
    Task<Result<bool>> DeleteCurrentUserAsync(string userId, string? password = null);
}
