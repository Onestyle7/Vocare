using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using Microsoft.AspNetCore.Mvc.RazorPages.Infrastructure;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Interfaces;
using VocareWebAPI.Shared.Services.Interfaces;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class JobOfferSyncService : IJobOfferSyncService
    {
        private readonly IJobOfferRepository _repository;
        private readonly INoFluffJobsParser _parser;
        private readonly ILogger<JobOfferSyncService> _logger;
        private readonly IEmbeddingService _embeddingService;
        private const string FeedUrl = "https://nofluffjobs.com/api/xml/jooble";

        public JobOfferSyncService(
            IJobOfferRepository repository,
            INoFluffJobsParser parser,
            ILogger<JobOfferSyncService> logger,
            IEmbeddingService embeddingService
        )
        {
            _repository = repository;
            _parser = parser;
            _logger = logger;
            _embeddingService = embeddingService;
        }

        public async Task<SyncResult> SyncOffersAsync()
        {
            var result = new SyncResult();
            try
            {
                var offers = await _parser.ParseFromUrlAsync(FeedUrl);
                result.Total = offers.Count();

                foreach (var offer in offers)
                {
                    try
                    {
                        var existing = await _repository.GetByReferenceNumberAsync(
                            offer.ReferenceNumber
                        );

                        if (existing == null)
                        {
                            await GenerateEmbeddingForOffer(offer);

                            await _repository.AddAsync(offer);
                            result.Added++;
                        }
                        else
                        {
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

                            if (existing.Embedding == null)
                            {
                                await GenerateEmbeddingForOffer(existing);
                            }

                            await _repository.UpdateAsync(existing);
                            result.Updated++;
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
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd podczas synchronizacji ofert");
                throw;
            }

            _logger.LogInformation(
                "Sync zakończony: {Added} dodanych, {Updated} zaktualizowanych, {Failed} błędów z {Total} total",
                result.Added,
                result.Updated,
                result.Failed,
                result.Total
            );

            return result;
        }

        public async Task<int> CleanupStaleOffersAsync()
        {
            var dbReferenceNumbers = await _repository.GetAllReferenceNumbersAsync();

            var feedOffers = await _parser.ParseFromUrlAsync(FeedUrl);
            var feedReferenceNumbers = feedOffers.Select(o => o.ReferenceNumber).ToHashSet();

            var staleReferenceNumbers = dbReferenceNumbers
                .Where(refNum => !feedReferenceNumbers.Contains(refNum))
                .ToList();

            if (staleReferenceNumbers.Any())
            {
                await _repository.DeleteByReferenceNumberAsync(staleReferenceNumbers);
                _logger.LogInformation(
                    "Usunięto {Count} nieaktualnych ofert",
                    staleReferenceNumbers.Count
                );
            }

            return staleReferenceNumbers.Count;
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

                _logger.LogDebug(
                    "Generuję embedding dla oferty: {Title} ({RefNumber})",
                    offer.Title,
                    offer.ReferenceNumber
                );

                offer.Embedding = await _embeddingService.GenerateEmbeddingAsync(textForEmbedding);

                _logger.LogDebug("Wygenerowano embedding dla oferty {Title}", offer.Title);
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

                    _logger.LogDebug("Backfill: wygenerowano embedding dla {Title}", offer.Title);
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
    }
}
