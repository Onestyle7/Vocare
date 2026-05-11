using Microsoft.EntityFrameworkCore;
using Stripe;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Exceptions;
using VocareWebAPI.RoadmapService.Exceptions;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;
using VocareWebAPI.RoadmapService.Repositories.Interfaces;
using VocareWebAPI.RoadmapService.Services.Interfaces;
using VocareWebAPI.UserManagement.Exceptions;

namespace VocareWebAPI.RoadmapService.Services.Implementations
{
    public class CareerRoadmapService : ICareerRoadmapService
    {
        private readonly IRoadmapGeneratorService _roadmapGeneratorService;
        private readonly IRoadmapRepository _roadmapRepository;
        private readonly ILogger<CareerRoadmapService> _logger;
        private readonly AppDbContext _context;

        public CareerRoadmapService(
            IRoadmapGeneratorService roadmapGeneratorService,
            IRoadmapRepository roadmapRepository,
            ILogger<CareerRoadmapService> logger,
            AppDbContext context
        )
        {
            _roadmapGeneratorService = roadmapGeneratorService;
            _roadmapRepository = roadmapRepository;
            _logger = logger;
            _context = context;
        }

        public async Task<Roadmap> GenerateRoadmapAsync(
            string userId,
            Guid careerPathId,
            int timeHorizonMonths
        )
        {
            var billing = await _context.UserBillings.FirstOrDefaultAsync(b => b.UserId == userId);
            var isPremium = billing?.SubscriptionStatus == SubscriptionStatus.Active;
            var maxRoadmaps = isPremium ? 10 : 1;
            var limit = await _roadmapRepository.CountActiveRoadmapsAsync(userId);

            if (limit >= maxRoadmaps)
                throw new RoadmapLimitReachedException(userId, maxRoadmaps);

            var duplicate = await _roadmapRepository.GetByCareerPathIdAsync(careerPathId);

            if (duplicate != null)
                throw new DuplicateRoadmapException(userId, careerPathId);

            if (timeHorizonMonths < 3 || timeHorizonMonths > 24)
                throw new InvalidRoadmapTimeHorizonException(userId, timeHorizonMonths);

            var ownsCareerPath = await _context.AiRecommendations.AnyAsync(r =>
                r.UserId == userId && r.CareerPaths.Any(cp => cp.Id == careerPathId)
            );

            if (!ownsCareerPath)
                throw new RoadmapAccessDeniedException(careerPathId, userId);

            var careerPath = await _context.CareerPaths.FindAsync(careerPathId);
            var userProfile = await _context.UserProfiles.FindAsync(userId);

            if (careerPath == null)
                throw new CareerPathNotFoundException(careerPathId);

            if (userProfile == null)
                throw new UserProfileNotFoundException(userId);

            var roadmapRequest = new RoadmapGenerationRequest
            {
                CareerPathName = careerPath.CareerName,
                RequiredSkills = userProfile.Skills,
                UserSkills = userProfile.Skills.Concat(userProfile.SoftSkills).ToList(),
                SuggestedSeniority = careerPath.SuggestedSeniority,
                TimeHorizonMonths = timeHorizonMonths,
            };

            var generateRoadmap = await _roadmapGeneratorService.GenerateAsync(roadmapRequest);

            var roadmap = new Roadmap
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CareerPathId = careerPathId,
                Title = generateRoadmap.Title,
                TimeHorizonMonths = timeHorizonMonths,
                Status = RoadmapStatus.Draft,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Phases = new List<RoadmapPhase>(),
            };

            var tempIdToGuid = new Dictionary<string, Guid>();

            foreach (var phaseDto in generateRoadmap.Phases)
            {
                var phase = new RoadmapPhase
                {
                    Id = Guid.NewGuid(),
                    RoadmapId = roadmap.Id,
                    Title = phaseDto.Title,
                    OrderIndex = phaseDto.OrderIndex,
                    Steps = new List<RoadmapStep>(),
                    StartMonth = phaseDto.StartMonth,
                    EndMonth = phaseDto.EndMonth,
                };

                foreach (var stepDto in phaseDto.Steps)
                {
                    var stepId = Guid.NewGuid();
                    tempIdToGuid[stepDto.TempId] = stepId;

                    var step = new RoadmapStep
                    {
                        Id = stepId,
                        PhaseId = phase.Id,
                        Title = stepDto.Title,
                        Subtitle = stepDto.Subtitle,
                        Description = stepDto.Description,
                        Topics = stepDto.Topics ?? new List<string>(),
                        StepType =
                            stepDto.StepType == "optional" ? StepType.Optional : StepType.Required,
                        Status = StepStatus.NotStarted,
                        OrderIndex = stepDto.OrderIndex,
                        ParentStepId = null, // ustawimy w przebiegu 2
                    };

                    phase.Steps.Add(step);
                }

                roadmap.Phases.Add(phase);
            }

            foreach (var phase in roadmap.Phases)
            {
                foreach (var step in phase.Steps)
                {
                    var stepDto = generateRoadmap
                        .Phases.SelectMany(p => p.Steps)
                        .FirstOrDefault(s => tempIdToGuid[s.TempId] == step.Id);

                    if (stepDto?.ParentRef != null && tempIdToGuid.ContainsKey(stepDto.ParentRef))
                    {
                        step.ParentStepId = tempIdToGuid[stepDto.ParentRef];
                    }
                }
            }

            await _roadmapRepository.AddAsync(roadmap);

            return roadmap;
        }

        public async Task<Roadmap?> GetByIdAsync(Guid roadmapId, string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.");

            var roadmap = await _roadmapRepository.GetByIdAsync(roadmapId);

            if (roadmap == null)
                throw new RoadmapNotFoundException(roadmapId);

            if (roadmap.UserId != userId)
                throw new RoadmapAccessDeniedException(roadmapId, userId);

            return roadmap;
        }

        public async Task<List<Roadmap>> GetUserRoadmapsAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.");

            return await _roadmapRepository.GetByUserIdAsync(userId);
        }

        public async Task UpdateStatusAsync(Guid roadmapId, string userId, RoadmapStatus status)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.");

            var roadmap = await _roadmapRepository.GetByIdAsync(roadmapId);

            if (roadmap == null)
                throw new RoadmapNotFoundException(roadmapId);

            if (roadmap.UserId != userId)
                throw new RoadmapAccessDeniedException(roadmapId, userId);

            roadmap.Status = status;
            roadmap.UpdatedAt = DateTime.UtcNow;

            await _roadmapRepository.UpdateAsync(roadmap);
        }

        public async Task ArchiveAsync(Guid roadmapId, string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.");

            var roadmap = await _roadmapRepository.GetByIdAsync(roadmapId);

            if (roadmap == null)
                throw new RoadmapNotFoundException(roadmapId);

            if (roadmap.UserId != userId)
                throw new RoadmapAccessDeniedException(roadmapId, userId);

            await _roadmapRepository.DeleteAsync(roadmapId);
        }

        public async Task<double> CalculateProgressAsync(Guid roadmapId, string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.");

            var roadmap = await _roadmapRepository.GetByIdAsync(roadmapId);

            if (roadmap == null)
                throw new RoadmapNotFoundException(roadmapId);

            if (roadmap.UserId != userId)
                throw new RoadmapAccessDeniedException(roadmapId, userId);

            var requiredSteps = roadmap
                .Phases.SelectMany(p => p.Steps)
                .Where(s => s.StepType == StepType.Required)
                .ToList();

            var totalSteps = requiredSteps.Count;
            if (totalSteps == 0)
                return 100.0;

            var completedSteps = requiredSteps.Count(s => s.Status == StepStatus.Completed);
            return (double)completedSteps / totalSteps * 100.0;
        }
    }
}
