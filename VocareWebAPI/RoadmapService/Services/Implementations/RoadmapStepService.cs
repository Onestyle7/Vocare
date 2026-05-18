using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.RoadmapService.Exceptions;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;
using VocareWebAPI.RoadmapService.Services.Interfaces;

namespace VocareWebAPI.RoadmapService.Services.Implementations
{
    public class RoadmapStepService : IRoadmapStepService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RoadmapStepService> _logger;

        public RoadmapStepService(AppDbContext context, ILogger<RoadmapStepService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<RoadmapStep> ChangeStatusAsync(
            Guid stepId,
            string userId,
            StepStatus newStatus
        )
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            var step = await _context
                .RoadmapSteps.Include(s => s.Phase)
                .ThenInclude(p => p.Roadmap)
                .FirstOrDefaultAsync(s => s.Id == stepId);
            if (step == null)
                throw new RoadmapStepNotFoundException(stepId);

            if (step.Phase.Roadmap.UserId != userId)
                throw new RoadmapAccessDeniedException(stepId, userId);

            step.Status = newStatus;

            var roadmap = step.Phase.Roadmap;

            if (roadmap.LifecycleStatus == LifecycleStatus.Draft)
            {
                roadmap.LifecycleStatus = LifecycleStatus.Active;
                roadmap.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
            return step;
        }

        public async Task<RoadmapStep> AddStepAsync(
            Guid phaseId,
            string userId,
            Guid? parentStep,
            string title,
            string subtitle,
            string? description,
            List<string>? Topics,
            StepType stepType
        )
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            var phase = await _context
                .RoadmapPhases.Include(p => p.Roadmap)
                .Include(p => p.Steps)
                .FirstOrDefaultAsync(p => p.Id == phaseId);

            if (phase == null)
                throw new RoadmapPhaseNotFoundException(phaseId);

            if (phase.Steps.Count >= 20)
                throw new PhaseStepLimitReachedException(phaseId, 20);

            if (phase.Roadmap.UserId != userId)
                throw new RoadmapAccessDeniedException(phaseId, userId);

            var newstep = new RoadmapStep
            {
                Id = Guid.NewGuid(),
                PhaseId = phaseId,
                ParentStepId = parentStep,
                Title = title,
                Subtitle = subtitle,
                Description = description,
                Topics = Topics ?? new List<string>(),
                StepType = stepType,
                OrderIndex = phase.Steps.Any() ? phase.Steps.Max(s => s.OrderIndex) + 1 : 0,
            };

            _context.RoadmapSteps.Add(newstep);
            await _context.SaveChangesAsync();
            return newstep;
        }

        public async Task<RoadmapStep> UpdateStepAsync(
            Guid stepId,
            string userId,
            string? title,
            string? subtitle,
            string? description,
            List<string>? topics,
            StepType? stepType
        )
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            var step = await _context
                .RoadmapSteps.Include(s => s.Phase)
                .ThenInclude(p => p.Roadmap)
                .FirstOrDefaultAsync(s => s.Id == stepId);

            if (step == null)
                throw new RoadmapStepNotFoundException(stepId);

            if (step.Phase.Roadmap.UserId != userId)
                throw new RoadmapAccessDeniedException(stepId, userId);

            if (title != null)
                step.Title = title;
            if (description != null)
                step.Description = description;
            if (topics != null)
                step.Topics = topics;
            if (stepType != null)
                step.StepType = stepType.Value;

            await _context.SaveChangesAsync();

            return step;
        }

        public async Task DeleteStepAsync(Guid stepId, string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            var step = await _context
                .RoadmapSteps.Include(s => s.Phase)
                .ThenInclude(p => p.Roadmap)
                .Include(s => s.Phase)
                .ThenInclude(p => p.Steps)
                .Include(s => s.ChildSteps)
                .FirstOrDefaultAsync(s => s.Id == stepId);

            if (step == null)
                throw new RoadmapStepNotFoundException(stepId);

            if (step.Phase.Roadmap.UserId != userId)
                throw new RoadmapAccessDeniedException(stepId, userId);

            foreach (var child in step.ChildSteps)
            {
                child.ParentStepId = step.ParentStepId; // przeniesienie dzieci do rodzica usuwanego kroku
            }
            _context.Remove(step);

            if (step.Phase.Steps.Count <= 1)
            {
                _context.RoadmapPhases.Remove(step.Phase);
            }

            await _context.SaveChangesAsync();
        }

        public async Task UpdateStepPositionAsync(
            string userId,
            Dictionary<Guid, (double x, double y)> positions
        )
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            var stepsId = positions.Keys.ToList();

            var steps = await _context
                .RoadmapSteps.Include(s => s.Phase)
                .ThenInclude(p => p.Roadmap)
                .Where(s => stepsId.Contains(s.Id))
                .ToListAsync();

            if (!steps.Any())
            {
                throw new ArgumentException("Steps not found");
            }
            var unauthorizedStep = steps.FirstOrDefault(s => s.Phase.Roadmap.UserId != userId);
            if (unauthorizedStep != null)
            {
                throw new RoadmapAccessDeniedException(unauthorizedStep.Phase.Roadmap.Id, userId);
            }

            foreach (var step in steps)
            {
                if (positions.TryGetValue(step.Id, out var pos))
                {
                    step.PositionX = pos.x;
                    step.PositionY = pos.y;
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
