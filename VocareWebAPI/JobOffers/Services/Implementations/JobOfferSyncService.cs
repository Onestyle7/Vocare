using VocareWebAPI.JobOffers.Exceptions;
using VocareWebAPI.JobOffers.Models.Dtos;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Models.Records;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Interfaces;
using VocareWebAPI.Shared.Services.Interfaces;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class JobOfferSyncService : IJobOfferSyncService
    {
        private readonly IJobOfferRepository _repository;
        private readonly ILogger<JobOfferSyncService> _logger;
        private readonly IEmbeddingService _embeddingService;
        private readonly IEnumerable<IJobOfferProvider> _providers;

        public JobOfferSyncService(
            IJobOfferRepository repository,
            ILogger<JobOfferSyncService> logger,
            IEmbeddingService embeddingService,
            IEnumerable<IJobOfferProvider> providers
        )
        {
            _repository = repository;
            _logger = logger;
            _embeddingService = embeddingService;
            _providers = providers;
        }

        public async Task<SyncResult> SyncOffersAsync(CancellationToken cancellationToken = default)
        public async Task<SyncResult> SyncOffersAsync(CancellationToken cancellationToken = default)
        {
            var totalResult = new SyncResult();
            foreach (var provider in _providers)
            {
                try
                {
                    _logger.LogInformation(
                        "Rozpoczynam synchronizację ofert pracy z {Source}",
                        provider.Source
                    );
                    var processResult = await ProcessOffersAsync(
                        provider.FetchOffersAsync(cancellationToken),
                        provider.Source,
                        cancellationToken
                    );

                    totalResult.Added += processResult.Added;
                    totalResult.Updated += processResult.Updated;
                    totalResult.Failed += processResult.Failed;
                    totalResult.Skipped += processResult.Skipped;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Błąd podczas synchronizacji ofert");
                    continue;
                }
            }
            totalResult.Total =
                totalResult.Added + totalResult.Updated + totalResult.Failed + totalResult.Skipped;

            _logger.LogInformation(
                "Zakończono synchronizację ofert pracy: {Added} dodanych, {Updated} zaktualizowanych, {Failed} nieudanych, {Skipped} pominiętych, {Total} łącznie",
                totalResult.Added,
                totalResult.Updated,
                totalResult.Failed,
                totalResult.Skipped,
                totalResult.Total
            );

            return totalResult;
        }

        private async Task<SyncResult> ProcessOffersAsync(
            IAsyncEnumerable<JobOffer> offers,
            JobOfferSource source,
            CancellationToken cancellationToken
        )
        {
            const int batchSize = 100;
            var processedInBatch = 0;
            var result = new SyncResult();

            var snapshots = await _repository.GetSnapshotsBySourceAsync(source);
            var processedRefs = new HashSet<string>();

            _logger.LogInformation(
                "Pobrano {Count} snapshotów ofert z bazy danych dla źródła {Source}",
                snapshots.Count(),
                source
            );

            await foreach (var offer in offers.WithCancellation(cancellationToken))
            {
                if (!processedRefs.Add(offer.ReferenceNumber))
                {
                    result.Skipped++;
                    continue;
                }
                try
                {
                    if (!snapshots.TryGetValue(offer.ReferenceNumber, out var snapshot))
                    {
                        await GenerateEmbeddingForOffer(offer);
                        await _repository.AddToContextAsync(offer);
                        result.Added++;
                        processedInBatch++;
                    }
                    else if (!HasChanges(snapshot, offer))
                    {
                        result.Skipped++;
                    }
                    else
                    {
                        var existing = await _repository.GetTrackedByIdAsync(snapshot.Id);
                        if (existing == null)
                        {
                            _logger.LogWarning(
                                "Snapshot istnieje ale encja nie znaleziona dla Id {Id}",
                                snapshot.Id
                            );
                            result.Failed++;
                            continue;
                        }

                        existing.Title = offer.Title;
                        existing.CompanyName = offer.CompanyName;
                        existing.Url = offer.Url;
                        existing.Country = offer.Country;
                        existing.Category = offer.Category;
                        existing.SeniorityLevel = offer.SeniorityLevel;
                        existing.JobType = offer.JobType;
                        existing.Description = offer.Description;
                        existing.BriefDescription = offer.BriefDescription;
                        existing.SalaryMin = offer.SalaryMin;
                        existing.SalaryMax = offer.SalaryMax;
                        existing.SalaryCurrency = offer.SalaryCurrency;
                        existing.SalaryPeriod = offer.SalaryPeriod;
                        existing.PublishedAt = offer.PublishedAt;
                        existing.UpdatedAt = DateTime.UtcNow;

                        var embeddingGenerated = false;
                        if (!snapshot.HasEmbedding)
                        {
                            await GenerateEmbeddingForOffer(existing);
                            embeddingGenerated = true;
                            embeddingGenerated = true;
                        }

                        _repository.UpdateInContext(existing, embeddingGenerated);
                        _repository.UpdateInContext(existing, embeddingGenerated);
                        result.Updated++;
                        processedInBatch++;
                        processedInBatch++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Błąd przy przetwarzaniu oferty {RefNumber}",
                        offer.ReferenceNumber
                    );
                    result.Failed++;
                }

                if (processedInBatch >= batchSize)
                {
                    await _repository.SaveChangesAsync();
                    _repository.ClearChangeTracker();
                    processedInBatch = 0;
                }
            }

            if (processedInBatch > 0)
            {
                await _repository.SaveChangesAsync();
                _repository.ClearChangeTracker();
            }

            return result;
        }

        public async Task<CleanupResult> CleanupStaleOffersAsync(
            JobOfferSource source,
            CancellationToken cancellationToken = default
        )
        public async Task<CleanupResult> CleanupStaleOffersAsync(
            JobOfferSource source,
            CancellationToken cancellationToken = default
        )
        {
            var dbReferenceNumbers = await _repository.GetAllReferenceNumbersAsync(source);
            var provider = _providers.FirstOrDefault(p => p.Source == source);

            if (provider is null)
                throw new UnsupportedSourceException(source);

            var feedReferenceNumbers = new HashSet<string>();

            await foreach (var offer in provider.FetchOffersAsync(cancellationToken))
            {
                feedReferenceNumbers.Add(offer.ReferenceNumber);
            }

            if (feedReferenceNumbers.Count == 0)
            {
                _logger.LogWarning(
                    "Nie udało się pobrać ofert z feedu podczas czyszczenia. Brak usuwania ofert."
                );
                return new CleanupResult
                {
                    Skipped = true,
                    SkipReason = "EMPTY_FEED",
                    RemovedCount = 0,
                    FeedSize = 0,
                    DbSize = dbReferenceNumbers.Count(),
                };
            }

            var staleReferenceNumbers = dbReferenceNumbers
                .Where(info => !feedReferenceNumbers.Contains(info.ReferenceNumber))
                .Select(info => info.ReferenceNumber)
                .ToList();

            var deletedCount = 0;

            if (staleReferenceNumbers.Any())
            {
                deletedCount = await _repository.DeleteByReferenceNumberAsync(
                    staleReferenceNumbers,
                    source
                );
                _logger.LogInformation("Usunięto {Count} nieaktualnych ofert", deletedCount);
            }

            return new CleanupResult
            {
                Skipped = false,
                RemovedCount = deletedCount,
                FeedSize = feedReferenceNumbers.Count,
                DbSize = dbReferenceNumbers.Count(),
            };
        }

        /// <summary>
        /// Generuje embedding dla oferty pracy
        /// </summary>
        /// <param name="offer"></param>
        /// <returns></returns>
        private async Task GenerateEmbeddingForOffer(JobOffer offer)
        {
            try
            {
                var textForEmbedding = BuildJobOfferTextForEmbedding(offer);

                offer.Embedding = await _embeddingService.GenerateEmbeddingAsync(textForEmbedding);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Nie udało się wygenerować embeddingu dla oferty: {Title} ({RefNumber}). Kontynuuję bez embeddingu",
                    offer.Title,
                    offer.ReferenceNumber
                );
            }
        }

        private string BuildJobOfferTextForEmbedding(JobOffer offer)
        {
            var parts = new List<string>();

            if (!string.IsNullOrWhiteSpace(offer.Title))
            {
                parts.Add(offer.Title);
            }

            if (!string.IsNullOrWhiteSpace(offer.Category))
            {
                parts.Add($"Kategoria: {offer.Category}");
            }
            if (!string.IsNullOrWhiteSpace(offer.Description))
            {
                var description =
                    offer.Description.Length > 1000 ? offer.Description[..1000] : offer.Description;
                parts.Add(description);
            }

            if (offer.Skills != null && offer.Skills.Any())
            {
                var skills = String.Join(", ", offer.Skills.Select(s => s.Name));
                parts.Add($"Wymagane umiejętności: {skills}");
            }

            return string.Join(". ", parts);
        }

        public async Task<BackfillResult> BackfillEmbeddingsAsync(int batchSize = 100)
        {
            var result = new BackfillResult();

            // Pobierz oferty bez embeddingu
            var offersWithoutEmbedding = await _repository.GetOffersWithoutEmbeddingAsync(
                batchSize
            );

            _logger.LogInformation(
                "Backfill: znaleziono {Count} ofert bez embeddingu",
                offersWithoutEmbedding.Count
            );

            foreach (var offer in offersWithoutEmbedding)
            {
                try
                {
                    await GenerateEmbeddingForOffer(offer);
                    await _repository.UpdateAsync(offer);
                    result.Processed++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Backfill: błąd dla oferty {Id}", offer.Id);
                    result.Failed++;
                }
            }

            // Policz ile zostało
            result.Remaining = await _repository.CountOffersWithoutEmbeddingAsync();

            _logger.LogInformation(
                "Backfill zakończony: {Processed} przetworzonych, {Failed} błędów, {Remaining} pozostało",
                result.Processed,
                result.Failed,
                result.Remaining
            );

            return result;
        }

        private bool HasChanges(JobOfferSnapshot snapshot, JobOffer offer)
        {
            return snapshot.Title != offer.Title
                || snapshot.CompanyName != offer.CompanyName
                || snapshot.Url != offer.Url
                || snapshot.Country != offer.Country
                || snapshot.Category != offer.Category
                || snapshot.SeniorityLevel != offer.SeniorityLevel
                || snapshot.JobType != offer.JobType
                || snapshot.Description != offer.Description
                || snapshot.BriefDescription != offer.BriefDescription
                || snapshot.SalaryMin != offer.SalaryMin
                || snapshot.SalaryMax != offer.SalaryMax
                || snapshot.SalaryCurrency != offer.SalaryCurrency
                || snapshot.SalaryPeriod != offer.SalaryPeriod
                || snapshot.PublishedAt != offer.PublishedAt;
        }
    }
}
