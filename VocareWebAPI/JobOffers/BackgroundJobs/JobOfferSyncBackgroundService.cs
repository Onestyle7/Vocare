using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VocareWebAPI.JobOffers.Services.Interfaces;

namespace VocareWebAPI.JobOffers.BackgroundJobs
{
    public class JobOfferSyncBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<JobOfferSyncBackgroundService> _logger;

        private readonly TimeSpan _syncInterval = TimeSpan.FromHours(2);

        private DateTime _lastCleanupDate = DateTime.MinValue;

        public JobOfferSyncBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<JobOfferSyncBackgroundService> logger
        )
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("JobOfferSyncBackgroundService został uruchomiony.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var syncService =
                        scope.ServiceProvider.GetRequiredService<IJobOfferSyncService>();

                    _logger.LogInformation("Rozpoczynam synchronizację ofert...");

                    var result = await syncService.SyncOffersAsync();

                    _logger.LogInformation(
                        "Sync zakończony: +{Added} nowych, ~{Updated} zaktualizowanych, {Failed} błędów",
                        result.Added,
                        result.Updated,
                        result.Failed
                    );

                    if (ShouldRunCleanup())
                    {
                        _logger.LogInformation("Rozpoczynam nocny cleanup nieaktualnych ofert...");

                        var removedCount = await syncService.CleanupStaleOffersAsync();

                        _lastCleanupDate = DateTime.UtcNow.Date;

                        _logger.LogInformation(
                            "Cleanup zakończony. Usunięto {Removed} ofert.",
                            removedCount
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Krytyczny błąd w pętli JobOfferSyncBackgroundService");
                }

                try
                {
                    await Task.Delay(_syncInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
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
