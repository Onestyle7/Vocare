using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.MarketNews.Services.Interfaces;

namespace VocareWebAPI.MarketNews.services.Implementations
{
    public class MarketNewsBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MarketNewsBackgroundService> _logger;

        public MarketNewsBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<MarketNewsBackgroundService> logger
        )
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var nextRun = GetNextSunday6AM();

            while (!stoppingToken.IsCancellationRequested)
            {
                var delay = nextRun - DateTime.UtcNow;

                if (delay > TimeSpan.Zero)
                {
                    _logger.LogInformation(
                        "Next news generation scheduled for: {NextRun}",
                        nextRun
                    );
                    await Task.Delay(delay, stoppingToken);
                }

                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var marketNewsService =
                        scope.ServiceProvider.GetRequiredService<IMarketNewsService>();

                    var generated = await marketNewsService.GenerateWeeklyNewsAsync();

                    if (generated)
                        _logger.LogInformation(
                            "Weekly news generated successfully at {Time}",
                            DateTime.UtcNow
                        );
                    else
                        _logger.LogInformation("News already exists for today");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error generating weekly news");
                }

                nextRun = GetNextSunday6AM();
            }
        }

        private DateTime GetNextSunday6AM()
        {
            var now = DateTime.UtcNow;
            var daysUntilSunday = ((int)DayOfWeek.Sunday - (int)now.DayOfWeek + 7) % 7;

            if (daysUntilSunday == 0 && now.Hour >= 6)
                daysUntilSunday = 7;

            return now.Date.AddDays(daysUntilSunday).AddHours(6);
        }
    }
}
