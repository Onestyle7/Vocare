using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.JobOffers.Models.Entities;

namespace VocareWebAPI.JobOffers.Repositories.Interfaces
{
    public interface IJobOfferRepository
    {
        Task<JobOffer?> GetByReferenceNumberAsync(string refNumber); // do sprawdzenia czy oferta już istnieje
        Task<IEnumerable<string>> GetAllReferenceNumbersAsync(); // Do porównania z feedem(sprawdzamy, które usunąć)
        Task AddAsync(JobOffer offer); // Dodanie nowej
        Task UpdateAsync(JobOffer offer); // Aktualizacja istniejącej
        Task DeleteByReferenceNumberAsync(IEnumerable<string> refNumbers); // Usuwanie niaktualnych
        Task<int> GetCountAsync(); // Sprawdzenie statystyk - ile mamy ofert
    }
}
