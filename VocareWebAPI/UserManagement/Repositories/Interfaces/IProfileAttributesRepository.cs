using VocareWebAPI.UserManagement.Models.Entities;

namespace VocareWebAPI.UserManagement.Repositories.Interfaces
{
    public interface IProfileAttributesRepository
    {
        Task<ProfileAttributes?> GetByUserIdAsync(string userId);
        Task SaveAsync(ProfileAttributes attributes);
    }
}
