using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Models.Entities;

namespace VocareWebAPI.RoadmapService.Jobs.Implementations
{
    public interface IRoadmapGenerationJob
    {
        Task GenerateAsync(Guid roadmapId, RoadmapGenerationRequest request);
    }
}
