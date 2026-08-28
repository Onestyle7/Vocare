using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;

namespace VocareWebAPI.RoadmapService.Services.Interfaces
{
    public interface ICareerRoadmapService
    {
        Task<Roadmap> GenerateRoadmapAsync(string userId, Guid careerPathId, int timeHorizonMonths);
        Task<Roadmap?> GetByIdAsync(Guid roadmapId, string userId);
        Task<List<Roadmap>> GetUserRoadmapsAsync(string userId);
        Task UpdateStatusAsync(Guid roadmapId, string userId, LifecycleStatus status);
        Task ArchiveAsync(Guid roadmapId, string userId);
        Task<double> CalculateProgressAsync(Guid roadmapId, string userId);

        Task<Roadmap> RetryGenerationAsync(Guid roadmapId, string userId);
    }
}
