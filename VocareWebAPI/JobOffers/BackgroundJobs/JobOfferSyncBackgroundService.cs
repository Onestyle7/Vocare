using Microsoft.Extensions.Options;
using VocareWebAPI.JobOffers.Configuration;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Services.Interfaces;

namespace VocareWebAPI.JobOffers.BackgroundJobs
{
    public class JobOfferSyncBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<JobOfferSyncBackgroundService> _logger;
        private readonly JobOfferSyncSettings _settings;
        private DateTime _lastCleanupDate = DateTime.MinValue;

        public JobOfferSyncBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<JobOfferSyncBackgroundService> logger,
            IOptions<JobOfferSyncSettings> options
        )
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _settings = options.Value;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (!_settings.EnableAutoSync)
            {
                _logger.LogInformation(
                    "JobOfferSyncBackgroundService: Auto-sync wyłączony."
                        + "Użyj endpointu aby zsynchronizować ręcznie."
                );
                return;
            }
            _logger.LogInformation("JobOfferSyncBackgroundService został uruchomiony.");

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                var syncInterval = TimeSpan.FromHours(_settings.SyncIntervalHours);
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var syncService =
                        scope.ServiceProvider.GetRequiredService<IJobOfferSyncService>();

                    _logger.LogInformation("Rozpoczynam synchronizację ofert...");
                    var result = await syncService.SyncOffersAsync(stoppingToken);

                    _logger.LogInformation(
                        "Sync zakończony: +{Added} nowych, ~{Updated} zaktualizowanych, {Failed} błędów",
                        result.Added,
                        result.Updated,
                        result.Failed
                    );

                    if (ShouldRunCleanup())
                    {
                        _logger.LogInformation("Rozpoczynam nocny cleanup nieaktualnych ofert...");
                        var totalRemoved = 0;
                        foreach (var source in Enum.GetValues<JobOfferSource>())
                        {
                            var cleanupResult = await syncService.CleanupStaleOffersAsync(
                                source,
                                stoppingToken
                            );
                            totalRemoved += cleanupResult.RemovedCount;
                            _logger.LogInformation(
                                "Cleanup {Source}: usunięto: {Removed} ofert",
                                source,
                                cleanupResult.RemovedCount
                            );
                        }
                        _lastCleanupDate = DateTime.UtcNow.Date;
                        _logger.LogInformation(
                            "Cleanup zakończony. Łącznie usunięto {Total} ofert.",
                            totalRemoved
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Krytyczny błąd w pętli JobOfferSyncBackgroundService");
                }
                _logger.LogInformation(
                    $"Czekam {syncInterval.TotalHours} godziny do nastepnej synchronizacji..."
                );
                try
                {
                    await Task.Delay(syncInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    _logger.LogInformation("Delay przerwany - aplikacja się zamyka.");
                    break;
                }
            }

            _logger.LogInformation("JobOfferSyncBackgroundService kończy pracę.");
        }

        private bool ShouldRunCleanup()
        {
            var now = DateTime.UtcNow;
            return now.Hour >= 3 && _lastCleanupDate != now.Date;
        }
    }
}
