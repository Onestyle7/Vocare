using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.CvGenerator.Models;

namespace VocareWebAPI.CvGenerator.Repositories.Interfaces
{
    public interface IGeneratedCvRepository
    {
        /// <summary>
        /// Dodaje nowe CV do bazy danych
        /// </summary>
        /// <param name="generatedCv"></param>
        /// <returns></returns>
        Task<GeneratedCv> AddAsync(GeneratedCv generatedCv);

        /// <summary>
        /// Pobiera CV po ID
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        Task<GeneratedCv?> GetByIdAsync(Guid id);

        /// <summary>
        /// Pobiera wszystkie CV użytkownika
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        Task<List<GeneratedCv>> GetUserCvsAsync(string userId);

        /// <summary>
        /// Pobiera liczbę aktywnych CV użytkownika
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        Task<int> GetUserCvCountAsync(string userId);

        /// <summary>
        /// Pobiera domyślne CV użytkownika
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        Task<GeneratedCv?> GetUserDefaultCvAsync(string userId);

        /// <summary>
        /// Aktualizuje CV
        /// </summary>
        /// <param name="generatedCv"></param>
        /// <returns></returns>
        Task<GeneratedCv> UpdateAsync(GeneratedCv generatedCv);

        /// <summary>
        /// Oznacza CV jako nieaktywne
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        Task<bool> DeactivateAsync(Guid id);

        /// <summary>
        /// Ustawia CV jako domyślne dla użytkownika
        /// </summary>
        /// <param name="cvId"></param>
        /// <param name="userId"></param>
        /// <returns></returns>
        Task SetDefaultAsync(Guid cvId, string userId);

        /// <summary>
        /// Sprawdza, czy CV należy do użytkownika
        /// </summary>
        /// <param name="cvId"></param>
        /// <param name="userId"></param>
        /// <returns></returns>
        Task<bool> BelongsToUserAsync(Guid cvId, string userId);
    }
}
