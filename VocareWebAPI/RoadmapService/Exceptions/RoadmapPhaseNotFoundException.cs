using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.RoadmapService.Exceptions
{
    public class RoadmapPhaseNotFoundException : NotFoundException
    {
        public Guid PhaseId { get; }

        public RoadmapPhaseNotFoundException(Guid phaseId)
            : base($"Roadmap phase with id {phaseId} not found", "ROADMAP_PHASE_NOT_FOUND")
        {
            PhaseId = phaseId;
        }
    }
}
