using Hangfire;
using Hangfire.Server;
using VocareWebAPI.Notifications.Models.Enums;
using VocareWebAPI.Notifications.Services.Interfaces;
using VocareWebAPI.RoadmapService.Exceptions;
using VocareWebAPI.RoadmapService.Jobs.Interfaces;
using VocareWebAPI.RoadmapService.Models.Dtos;
using VocareWebAPI.RoadmapService.Models.Entities;
using VocareWebAPI.RoadmapService.Models.Enums;
using VocareWebAPI.RoadmapService.Repositories.Interfaces;
using VocareWebAPI.RoadmapService.Services.Interfaces;
using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.RoadmapService.Jobs.Implementations
{
    public class RoadmapGenerationJob : IRoadmapGenerationJob
    {
        private readonly IRoadmapRepository _roadmapRepository;
        private readonly IRoadmapGeneratorService _roadmapGeneratorService;
        private readonly INotificationService _notificationService;

        public RoadmapGenerationJob(
            IRoadmapRepository roadmapRepository,
            IRoadmapGeneratorService roadmapGeneratorService,
            INotificationService notificationService
        )
        {
            _roadmapRepository = roadmapRepository;
            _roadmapGeneratorService = roadmapGeneratorService;
            _notificationService = notificationService;
        }

        [AutomaticRetry(Attempts = 1)]
        public async Task GenerateAsync(
            Guid roadmapId,
            RoadmapGenerationRequest request,
            PerformContext context
        )
        {
            var roadmap = await _roadmapRepository.GetByIdAsync(roadmapId);
            if (roadmap == null)
                throw new RoadmapNotFoundException(roadmapId);

            // Idempotency check, sprawdzamy czy wygenerowana, lub w trakcie generowania
            if (roadmap.GenerationStatus is GenerationStatus.Ready or GenerationStatus.Generating)
                return;

            roadmap.GenerationStatus = GenerationStatus.Generating;
            await _roadmapRepository.UpdateAsync(roadmap);

            try
            {
                var generateRoadmap = await _roadmapGeneratorService.GenerateAsync(request);

                roadmap.Title = generateRoadmap.Title;
                roadmap.UpdatedAt = DateTime.UtcNow;
                roadmap.GenerationStatus = GenerationStatus.Ready;

                var tempIdToStep = new Dictionary<string, RoadmapStep>();

                foreach (var phaseDto in generateRoadmap.Phases)
                {
                    var phase = new RoadmapPhase
                    {
                        Title = phaseDto.Title,
                        OrderIndex = phaseDto.OrderIndex,
                        Steps = new List<RoadmapStep>(),
                        StartMonth = phaseDto.StartMonth,
                        EndMonth = phaseDto.EndMonth,
                    };

                    foreach (var stepDto in phaseDto.Steps)
                    {
                        var step = new RoadmapStep
                        {
                            Title = stepDto.Title,
                            Subtitle = stepDto.Subtitle,
                            Description = stepDto.Description,
                            Topics = stepDto.Topics ?? new List<string>(),
                            StepType =
                                stepDto.StepType == "optional"
                                    ? StepType.Optional
                                    : StepType.Required,
                            Status = StepStatus.NotStarted,
                            OrderIndex = stepDto.OrderIndex,
                        };

                        tempIdToStep[stepDto.TempId] = step;
                        phase.Steps.Add(step);
                    }

                    roadmap.Phases.Add(phase);
                }

                foreach (var phaseDto in generateRoadmap.Phases)
                {
                    foreach (var stepDto in phaseDto.Steps)
                    {
                        if (
                            stepDto.ParentRef != null
                            && tempIdToStep.ContainsKey(stepDto.ParentRef)
                        )
                        {
                            tempIdToStep[stepDto.TempId].ParentStep = tempIdToStep[
                                stepDto.ParentRef
                            ];
                        }
                    }
                }

                await _roadmapRepository.UpdateAsync(roadmap);

                await _notificationService.CreateAsync(
                    userId: roadmap.UserId,
                    title: "Roadmapa gotowa",
                    message: $"Twoja roadmapa '{roadmap.Title}' jest gotowa do przeglądania",
                    type: NotificationType.RoadmapGenerationCompleted,
                    relatedEntityId: roadmap.Id
                );
            }
            catch (Exception ex)
            {
                var retryCount = context.GetJobParameter<int>("RetryCount");
                bool isFinalAttempt = retryCount >= 1;

                if (isFinalAttempt)
                {
                    roadmap.GenerationStatus = GenerationStatus.Failed;
                    roadmap.FailureReason = "Generowanie nie powiodło się. Spróbuj ponownie.";
                    roadmap.UpdatedAt = DateTime.UtcNow;
                    await _roadmapRepository.UpdateAsync(roadmap);

                    await _notificationService.CreateAsync(
                        userId: roadmap.UserId,
                        title: "Generowanie nie powiodło się",
                        message: "Generowanie roadmapy nie powiodło się. Możesz spróbować ponownie.",
                        type: NotificationType.RoadmapGenerationFailed,
                        relatedEntityId: roadmap.Id
                    );
                }
                if (ex is DomainException)
                    throw;

                throw new AiServiceException("Błąd podczas generowania roadmapy.", ex);
            }

            return;
        }
    }
}
