using System.Data;
using Hangfire;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Stripe;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Exceptions;
using VocareWebAPI.RoadmapService.Exceptions;
using VocareWebAPI.RoadmapService.Jobs.Implementations;
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
        private readonly IRoadmapRepository _roadmapRepository;
        private readonly AppDbContext _context;
        private readonly IBackgroundJobClient _backgroundJobClient;

        public CareerRoadmapService(
            IRoadmapRepository roadmapRepository,
            AppDbContext context,
            IBackgroundJobClient backgroundJobClient
        )
        {
            _roadmapRepository = roadmapRepository;
            _context = context;
            _backgroundJobClient = backgroundJobClient;
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

            // Przenieść do repository
            var careerPath = await _context.CareerPaths.FindAsync(careerPathId);
            var userProfile = await _context.UserProfiles.FindAsync(userId);

            if (careerPath == null)
                throw new CareerPathNotFoundException(careerPathId);

            if (userProfile == null)
                throw new UserProfileNotFoundException(userId);

            var roadmap = new Roadmap
            {
                GenerationStatus = GenerationStatus.Pending,
                LifecycleStatus = LifecycleStatus.Draft,
                Title = "Generowananie...",
                Phases = [],
                UserId = userId,
                CareerPathId = careerPathId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                TimeHorizonMonths = timeHorizonMonths,
            };

            await _roadmapRepository.AddAsync(roadmap);

            var roadmapRequest = new RoadmapGenerationRequest
            {
                CareerPathName = careerPath.CareerName,
                RequiredSkills = userProfile.Skills,
                UserSkills = userProfile.Skills.Concat(userProfile.SoftSkills).ToList(),
                SuggestedSeniority = careerPath.SuggestedSeniority,
                TimeHorizonMonths = timeHorizonMonths,
            };

            var jobId = _backgroundJobClient.Enqueue<IRoadmapGenerationJob>(job =>
                job.GenerateAsync(roadmap.Id, roadmapRequest)
            );

            roadmap.HangfireJobId = jobId;
            await _roadmapRepository.UpdateAsync(roadmap);

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

        public async Task UpdateStatusAsync(Guid roadmapId, string userId, LifecycleStatus status)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.");

            var roadmap = await _roadmapRepository.GetByIdAsync(roadmapId);

            if (roadmap == null)
                throw new RoadmapNotFoundException(roadmapId);

            if (roadmap.UserId != userId)
                throw new RoadmapAccessDeniedException(roadmapId, userId);

            roadmap.LifecycleStatus = status;
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

        public async Task<Roadmap> RetryGenerationAsync(Guid roadmapId, string userId)
        {
            var roadmap = await _roadmapRepository.GetByIdAsync(roadmapId);
            if (roadmap == null)
                throw new RoadmapNotFoundException(roadmapId);

            if (userId != roadmap.UserId)
                throw new RoadmapAccessDeniedException(roadmapId, userId);

            if (roadmap.GenerationStatus != GenerationStatus.Failed)
                throw new InvalidRoadmapStateException(
                    roadmapId,
                    roadmap.GenerationStatus.ToString()
                );

            roadmap.GenerationStatus = GenerationStatus.Pending;
            roadmap.FailureReason = null;
            roadmap.UpdatedAt = DateTime.UtcNow;

            // Przenieść do repository
            var careerPath = await _context.CareerPaths.FindAsync(roadmap.CareerPathId);
            var userProfile = await _context.UserProfiles.FindAsync(userId);

            var roadmapRequest = new RoadmapGenerationRequest
            {
                CareerPathName = careerPath.CareerName,
                RequiredSkills = userProfile.Skills,
                UserSkills = userProfile.Skills.Concat(userProfile.SoftSkills).ToList(),
                SuggestedSeniority = careerPath.SuggestedSeniority,
                TimeHorizonMonths = roadmap.TimeHorizonMonths,
            };

            var jobId = _backgroundJobClient.Enqueue<IRoadmapGenerationJob>(job =>
                job.GenerateAsync(roadmap.Id, roadmapRequest)
            );

            roadmap.HangfireJobId = jobId;
            await _roadmapRepository.UpdateAsync(roadmap);

            return roadmap;
        }
    }
}
