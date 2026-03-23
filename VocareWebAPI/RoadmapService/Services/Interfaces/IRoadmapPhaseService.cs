using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.RoadmapService.Models.Entities;

namespace VocareWebAPI.RoadmapService.Services.Interfaces
{
    public interface IRoadmapPhaseService
    {
        Task<RoadmapPhase> UpdateNameAsync(Guid phaseId, string userId, string newName);
        Task DeletePhaseAsync(Guid phaseId, string userId);
    }
}
