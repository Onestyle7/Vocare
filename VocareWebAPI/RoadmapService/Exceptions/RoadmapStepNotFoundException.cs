using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.RoadmapService.Exceptions
{
    public class RoadmapStepNotFoundException : NotFoundException
    {
        public Guid StepId { get; }

        public RoadmapStepNotFoundException(Guid stepId)
            : base($"Roadmap step with id {stepId} not found", "ROADMAP_STEP_NOT_FOUND")
        {
            StepId = stepId;
        }
    }
}
