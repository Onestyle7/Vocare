using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.RoadmapService.Exceptions
{
    public class RoadmapNotFoundException : NotFoundException
    {
        public Guid RoadmapId { get; }

        public RoadmapNotFoundException(Guid roadmapId)
            : base($"Roadmap with id {roadmapId} not found", "ROADMAP_NOT_FOUND")
        {
            RoadmapId = roadmapId;
        }
    }
}
