using System.Runtime.CompilerServices;
using VocareWebAPI.JobOffers.Exceptions;
using VocareWebAPI.JobOffers.Models.Dtos;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
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
        {
            SyncResult processResult;
            try
            {
                var combinedOffers = GetCombinedOffersAsync(cancellationToken);
                processResult = await ProcessOffersAsync(combinedOffers, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd podczas synchronizacji ofert");
                throw;
            }

            processResult.Total =
                processResult.Added + processResult.Updated + processResult.Failed;

            _logger.LogInformation(
                "Sync zakończony: {Added} dodanych, {Updated} zaktualizowanych, {Failed} błędów z {Total} total oraz {Skipped} pominiętych",
                processResult.Added,
                processResult.Updated,
                processResult.Failed,
                processResult.Total,
                processResult.Skipped
            );

            return processResult;
        }

        private async Task<SyncResult> ProcessOffersAsync(
            IAsyncEnumerable<JobOffer> offers,
            CancellationToken cancellationToken
        )
        {
            const int batchSize = 100;
            var processedInBatch = 0;

            var result = new SyncResult();
            await foreach (var offer in offers.WithCancellation(cancellationToken))
            {
                try
                {
                    var existing = await _repository.GetByReferenceNumberAsync(
                        offer.ReferenceNumber,
                        offer.Source
                    );

                    if (existing == null)
                    {
                        await GenerateEmbeddingForOffer(offer);

                        await _repository.AddToContextAsync(offer);
                        result.Added++;
                        processedInBatch++;
                    }
                    else
                    {
                        if (!HasChanges(existing, offer))
                        {
                            result.Skipped++;
                            continue;
                        }

                        // Aktualizujemy wszystkie pola oprócz Id, ReferenceNumber, CreatedAt
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

                        if (existing.Embedding == null)
                        {
                            await GenerateEmbeddingForOffer(existing);
                            embeddingGenerated = true;
                        }

                        _repository.UpdateInContext(existing, embeddingGenerated);
                        result.Updated++;
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

            if (staleReferenceNumbers.Any())
            {
                await _repository.DeleteByReferenceNumberAsync(staleReferenceNumbers, source);
                _logger.LogInformation(
                    "Usunięto {Count} nieaktualnych ofert",
                    staleReferenceNumbers.Count
                );
            }

            return new CleanupResult
            {
                Skipped = false,
                RemovedCount = staleReferenceNumbers.Count,
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

        private bool HasChanges(JobOffer existing, JobOffer offer)
        {
            return existing.Title != offer.Title
                || existing.CompanyName != offer.CompanyName
                || existing.Url != offer.Url
                || existing.Country != offer.Country
                || existing.Category != offer.Category
                || existing.SeniorityLevel != offer.SeniorityLevel
                || existing.JobType != offer.JobType
                || existing.Description != offer.Description
                || existing.BriefDescription != offer.BriefDescription
                || existing.SalaryMin != offer.SalaryMin
                || existing.SalaryMax != offer.SalaryMax
                || existing.SalaryCurrency != offer.SalaryCurrency
                || existing.SalaryPeriod != offer.SalaryPeriod
                || existing.PublishedAt != offer.PublishedAt;
        }

        private async IAsyncEnumerable<JobOffer> GetCombinedOffersAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken = default
        )
        {
            foreach (var provider in _providers)
            {
                var offerList = new List<JobOffer>();
                try
                {
                    _logger.LogInformation("Fetching offers from {Source}", provider.Source);
                    await foreach (var offer in provider.FetchOffersAsync(cancellationToken))
                    {
                        offerList.Add(offer);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching offers from {Source}", provider.Source);
                    continue;
                }
                foreach (var offer in offerList)
                {
                    yield return offer;
                }
            }
        }
    }
}
