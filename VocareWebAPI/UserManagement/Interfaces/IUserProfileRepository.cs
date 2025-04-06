using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Repositories
{
    public interface IUserProfileRepository
    {
        Task<UserProfile> GetUserProfileByIdAsync(string userId);
        Task UpdateUserProfileAsync(UserProfile profile);
    }
}
