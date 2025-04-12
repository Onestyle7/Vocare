using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Dtos;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.Services
{
    /// <summary>
    /// Interfejs serwisu odpowiedzialnego za generowanie i pobieranie rekomednacji zawodowych przu użyciu AI
    /// </summary>
    public interface IAiService
    {
        /// <summary>
        /// Generuje rekomendacje zawodowe na podstawie profilu użytkownika
        /// </summary>
        /// <param name="profile">Profil użytkownika</param>
        /// <returns>Rekomendacje zawodowe w formacie DTO</returns>
        Task<AiCareerResponseDto> GetCareerRecommendationsAsync(UserProfile profile);

        /// <summary>
        /// Pobiera ostatnią rekomendację zawodową dla użytkownika
        /// </summary>
        /// <param name="userId">Identyfikator użytkownika</param>
        /// <returns>Ostatnia rekomendacja zawodowa w formacie DTO lub null, jesli nie znaleziono</returns>
        Task<AiCareerResponseDto> GetLastRecommendationAsync(string userId);
    }
}
