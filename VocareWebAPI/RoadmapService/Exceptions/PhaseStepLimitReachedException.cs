using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.RoadmapService.Exceptions
{
    public class PhaseStepLimitReachedException : BusinessRuleException
    {
        public Guid PhaseId { get; }
        public int MaxSteps { get; }

        public PhaseStepLimitReachedException(Guid phaseId, int maxSteps)
            : base(
                $"Phase step limit: {maxSteps} reached for roadmap {phaseId}",
                "PHASE_STEP_LIMIT_REACHED"
            )
        {
            PhaseId = phaseId;
            MaxSteps = maxSteps;
        }
    }
}
