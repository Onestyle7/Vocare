using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.UserManagement.Exceptions
{
    public class UserProfileNotFoundException : NotFoundException
    {
        public string UserId { get; }

        public UserProfileNotFoundException(string userId)
            : base($"User profile not found for userId: {userId}", "USER_PROFILE_NOT_FOUND")
        {
            UserId = userId;
        }
    }
}
