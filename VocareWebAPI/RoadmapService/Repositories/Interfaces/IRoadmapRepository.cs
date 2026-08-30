using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.RoadmapService.Models.Entities;

namespace VocareWebAPI.RoadmapService.Repositories.Interfaces
{
    public interface IRoadmapRepository
    {
        Task<Roadmap?> GetByIdAsync(Guid roadmapId);
        Task<List<Roadmap>> GetByUserIdAsync(string userId);
        Task<Roadmap?> GetByCareerPathIdAsync(Guid careerPathId);
        Task<int> CountActiveRoadmapsAsync(string userId);
        Task AddAsync(Roadmap roadmap);
        Task UpdateAsync(Roadmap roadmap);
        Task DeleteAsync(Guid roadmapId);
    }
}
