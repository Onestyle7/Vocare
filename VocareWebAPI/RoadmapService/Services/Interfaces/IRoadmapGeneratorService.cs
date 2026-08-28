using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.RoadmapService.Models.Dtos;

namespace VocareWebAPI.RoadmapService.Services.Interfaces
{
    public interface IRoadmapGeneratorService
    {
        Task<GeneratedRoadmapDto> GenerateAsync(RoadmapGenerationRequest request);
    }
}
