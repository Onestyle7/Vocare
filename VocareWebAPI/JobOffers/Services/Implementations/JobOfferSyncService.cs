using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Interfaces;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class JobOfferSyncService : IJobOfferSyncService
    {
        private readonly IJobOfferRepository _repository;
        private readonly INoFluffJobsParser _parser;
        private readonly ILogger<JobOfferSyncService> _logger;
        private const string FeedUrl = "https://nofluffjobs.com/api/xml/jooble";

        public JobOfferSyncService(
            IJobOfferRepository repository,
            INoFluffJobsParser parser,
            ILogger<JobOfferSyncService> logger
        )
        {
            _repository = repository;
            _parser = parser;
            _logger = logger;
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
    }
}
