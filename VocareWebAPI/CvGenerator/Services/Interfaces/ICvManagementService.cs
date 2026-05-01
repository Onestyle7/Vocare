using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.CvGenerator.Models.Dtos;

namespace VocareWebAPI.CvGenerator.Services.Interfaces
{
    /// <summary>
    /// Interface serwisu do zarządzania CV.
    /// </summary>
    public interface ICvManagementService
    {
        /// <summary>
        /// Pobiera listę CV uzytkownika.
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        Task<List<CvListItemDto>> GetUserCvsAsync(string userId);

        /// <summary>
        /// Pobiera szczegóły konkretnego CV.
        /// </summary>
        /// <param name="cvId"></param>
        /// <param name="userId"></param>
        /// <returns></returns>
        Task<CvDetailsDto> GetCvDetailsAsync(Guid cvId, string userId);

        /// <summary>
        /// Tworzy nowe CV
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="createDto"></param>
        /// <returns></returns>
        Task<CvDetailsDto> CreateCvAsync(string userId, CreateCvDto createDto);

        /// <summary>
        /// Aktualizuje istniejące CV
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="updateDto"></param>
        /// <returns></returns>
        Task<CvDetailsDto> UpdateCvAsync(string userId, UpdateCvDto updateDto);

        /// <summary>
        /// Usuwa CV (soft delete)
        /// </summary>
        /// <param name="cvId"></param>
        /// <param name="userId"></param>
        /// <returns></returns>
        Task DeleteCvAsync(Guid cvId, string userId);

        /// <summary>
        /// Ustawia CV jako domyślne
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="cvId"></param>
        /// <returns></returns>
        Task SetDefaultCvAsync(string userId, Guid cvId);

        /// <summary>
        /// Sprawdza, czy użytkownik może utworzyć kolejne CV
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        Task<bool> CanCreateNewCvAsync(string userId);

        /// <summary>
        /// Pobiera maksymalną liczbę CV, dla użytkownika
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        Task<int> GetMaxCvLimitAsync(string userId);
    }
}
