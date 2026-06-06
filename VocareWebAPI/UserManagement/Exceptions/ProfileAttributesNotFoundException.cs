using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.UserManagement.Exceptions
{
    public class ProfileAttributesNotFoundException : NotFoundException
    {
        public string UserId { get; }

        public ProfileAttributesNotFoundException(string userId)
            : base(
                $"Profile attributes not found for user with ID {userId}",
                "PROFILE_ATTRIBUTES_NOT_FOUND"
            )
        {
            UserId = userId;
        }
    }
}
