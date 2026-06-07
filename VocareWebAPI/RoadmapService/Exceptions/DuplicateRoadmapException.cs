using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.RoadmapService.Exceptions
{
    public class DuplicateRoadmapException : ConflictException
    {
        public string UserId { get; }
        public Guid CareerPathId { get; }

        public DuplicateRoadmapException(string userId, Guid careerPathId)
            : base(
                $"User {userId} already has roadmap for career path {careerPathId}",
                "DUPLICATE_ROADMAP"
            )
        {
            UserId = userId;
            CareerPathId = careerPathId;
        }
    }
}
