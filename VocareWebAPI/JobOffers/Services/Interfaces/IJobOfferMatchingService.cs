using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.JobOffers.Models.Dtos;

namespace VocareWebAPI.JobOffers.Services.Interfaces
{
    public interface IJobOfferMatchingService
    {
        /// <summary>
        /// Pobiera oferty pracy najlepiej pasujace do danej ściezki
        /// </summary>
        /// <param name="careerPathId">Id ściezki kariery</param>
        /// <param name="limit">Maksymalna liczba ofert do zwrócenia</param>
        /// <returns>Lista dopasowany ofert</returns>
        Task<List<JobOfferMatchDto>> GetMatchingOffersForCareerPathAsync(
            Guid careerPathId,
            int limit = 5
        );

        /// <summary>
        /// Pobiera oferty pracy dla wszystkich ścieżek z ostatniej rekomendacji usera
        /// </summary>
        /// <param name="userId">Id użytkownika</param>
        /// <param name="limitPerPath">Maksymalna liczba ofert pracy na sciezke</param>
        /// <returns>Słownika -> Lista ofert</returns>
        Task<Dictionary<Guid, List<JobOfferMatchDto>>> GetMatchingOffersForUserAsync(
            string userId,
            int limitPerPath = 5
        );
    }
}
