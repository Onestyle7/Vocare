using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.RoadmapService.Exceptions
{
    public class InvalidRoadmapTimeHorizonException : BusinessRuleException
    {
        public string UserId { get; }
        public int TimeHorizonInMonths { get; }

        public InvalidRoadmapTimeHorizonException(string userId, int timeHorizonInMonths)
            : base(
                $"Invalid roadmap time horizon: {timeHorizonInMonths} for user {userId}",
                "INVALID_ROADMAP_TIME_HORIZONT"
            )
        {
            UserId = userId;
            TimeHorizonInMonths = timeHorizonInMonths;
        }
    }
}
