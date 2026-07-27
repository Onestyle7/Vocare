using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Models.Records;

namespace VocareWebAPI.JobOffers.Repositories.Interfaces
{
    public interface IJobOfferRepository
    {
        Task<JobOffer?> GetByReferenceNumberAsync(string refNumber, JobOfferSource source); // do sprawdzenia czy oferta już istnieje
        Task<IEnumerable<JobStaleInfo>> GetAllReferenceNumbersAsync(JobOfferSource source); // Do porównania z feedem(sprawdzamy, które usunąć)
        Task AddAsync(JobOffer offer); // Dodanie nowej
        Task UpdateAsync(JobOffer offer); // Aktualizacja istniejącej
        Task DeleteByReferenceNumberAsync(IEnumerable<string> refNumbers, JobOfferSource source); // Usuwanie niaktualnych
        Task<int> GetCountAsync(); // Sprawdzenie statystyk - ile mamy ofert
        Task<List<JobOffer>> GetOffersWithoutEmbeddingAsync(int limit);
        Task<int> CountOffersWithoutEmbeddingAsync();
        Task<List<string>> GetAllUniqueSkillNamesAsync();
    }
}
