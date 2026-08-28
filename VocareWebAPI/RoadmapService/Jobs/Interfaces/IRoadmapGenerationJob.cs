using Hangfire.Server;
using VocareWebAPI.RoadmapService.Models.Dtos;

namespace VocareWebAPI.RoadmapService.Jobs.Interfaces
{
    public interface IRoadmapGenerationJob
    {
        Task GenerateAsync(
            Guid roadmapId,
            RoadmapGenerationRequest request,
            PerformContext context
        );
    }
}
