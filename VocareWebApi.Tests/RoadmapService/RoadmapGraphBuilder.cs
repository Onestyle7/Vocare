using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VocareWebAPI.Data;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;

namespace VocareWebApi.Tests.RoadmapService
{
    /// <summary>
    /// Zasieje w bazie testowej graf Roadmap → Phase → Step do testów serwisów faz i kroków.
    /// </summary>
    internal static class RoadmapGraphBuilder
    {
        public static async Task<(Roadmap roadmap, RoadmapPhase phase, RoadmapStep step)> SeedAsync(
            AppDbContext context,
            string userId,
            LifecycleStatus lifecycle = LifecycleStatus.Active,
            int stepCount = 1
        )
        {
            var roadmap = new Roadmap
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CareerPathId = Guid.NewGuid(),
                Title = "Roadmap",
                LifecycleStatus = lifecycle,
                GenerationStatus = GenerationStatus.Ready,
            };
            var phase = new RoadmapPhase
            {
                Id = Guid.NewGuid(),
                RoadmapId = roadmap.Id,
                Title = "Phase 1",
                OrderIndex = 0,
            };
            roadmap.Phases.Add(phase);

            RoadmapStep? firstStep = null;
            for (var i = 0; i < stepCount; i++)
            {
                var step = new RoadmapStep
                {
                    Id = Guid.NewGuid(),
                    PhaseId = phase.Id,
                    Title = $"Step {i + 1}",
                    Subtitle = "sub",
                    OrderIndex = i,
                    StepType = StepType.Required,
                    Status = StepStatus.NotStarted,
                };
                phase.Steps.Add(step);
                firstStep ??= step;
            }

            context.Roadmaps.Add(roadmap);
            await context.SaveChangesAsync();
            context.ChangeTracker.Clear();
            return (roadmap, phase, firstStep!);
        }
    }
}
