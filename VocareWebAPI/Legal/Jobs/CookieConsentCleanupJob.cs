using Microsoft.Extensions.Options;
using VocareWebAPI.Legal.Configuration;
using VocareWebAPI.Legal.Repositories.Interfaces;

namespace VocareWebAPI.Legal.Jobs
{
    public class CookieConsentCleanupJob(
        ILegalRepository repository,
        IOptions<CookieConsentConfig> options,
        ILogger<CookieConsentCleanupJob> logger
    )
    {
        public async Task ExecuteAsync()
        {
            var cutoff = DateTime.UtcNow.AddYears(-options.Value.RetentionYears);
            var deleted = await repository.DeleteCookieConsentRecordsOlderThanAsync(cutoff);
            logger.LogInformation(
                "Cookie consent cleanup: deleted {Count} records older than {Cutoff:O}",
                deleted,
                cutoff
            );
        }
    }
}
