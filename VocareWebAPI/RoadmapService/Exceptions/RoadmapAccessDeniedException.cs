using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.RoadmapService.Exceptions
{
    public class RoadmapAccessDeniedException : ForbiddenException
    {
        public Guid RoadmapId { get; }
        public string UserId { get; }

        public RoadmapAccessDeniedException(Guid roadmapId, string userId)
            : base(
                $"User {userId} does not have access to roadmap {roadmapId}",
                "ROADMAP_ACCESS_DENIED"
            )
        {
            RoadmapId = roadmapId;
            UserId = userId;
        }
    }
}
