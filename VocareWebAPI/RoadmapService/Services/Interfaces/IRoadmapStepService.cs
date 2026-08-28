using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;

namespace VocareWebAPI.RoadmapService.Services.Interfaces
{
    public interface IRoadmapStepService
    {
        Task<RoadmapStep> ChangeStatusAsync(Guid stepId, string userId, StepStatus newStatus);
        Task<RoadmapStep> AddStepAsync(
            Guid phaseId,
            string userId,
            Guid? parentStep,
            string title,
            string subtitle,
            string? description,
            List<string>? Topics,
            StepType stepType
        );
        Task<RoadmapStep> UpdateStepAsync(
            Guid stepId,
            string userId,
            string? title,
            string? subtitle,
            string? description,
            List<string>? topics,
            StepType? stepType
        );
        Task DeleteStepAsync(Guid stepId, string userId);
        Task UpdateStepPositionAsync(
            string userId,
            Dictionary<Guid, (double x, double y)> positions
        );
    }
}
