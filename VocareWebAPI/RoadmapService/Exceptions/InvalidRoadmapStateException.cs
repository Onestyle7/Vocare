using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.RoadmapService.Exceptions
{
    public class InvalidRoadmapStateException : ConflictException
    {
        public Guid RoadmapId { get; set; }
        public string CurrentStatus { get; set; }

        public InvalidRoadmapStateException(Guid roadmapId, string currentStatus)
            : base(
                $"Roadmap {roadmapId} is in state {currentStatus} and cannot be retried",
                "INVALID_ROADMAP_STATE"
            )
        {
            RoadmapId = roadmapId;
            CurrentStatus = currentStatus;
        }
    }
}
