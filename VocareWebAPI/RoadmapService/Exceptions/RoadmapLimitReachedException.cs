using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.RoadmapService.Exceptions
{
    public class RoadmapLimitReachedException : BusinessRuleException
    {
        public string UserId { get; }
        public int MaxAllowedRoadmaps { get; }

        public RoadmapLimitReachedException(string userId, int maxAllowedRoadmaps)
            : base(
                $"Roadmap limit: {maxAllowedRoadmaps} reached for user {userId}",
                "ROADMAP_LIMIT_REACHED"
            )
        {
            UserId = userId;
            MaxAllowedRoadmaps = maxAllowedRoadmaps;
        }
    }
}
