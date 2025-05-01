using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Dtos.MarketAnalysis;

namespace VocareWebAPI.Repositories.Interfaces
{
    /// <summary>
    /// Interfejs serwisu do analizy rynku pracy
    /// </summary>
    public interface IMarketAnalysisService
    {
        /// <summary>
        /// Pobiera analizę rynku pracy dla danego użytkownika
        /// </summary>
        /// <param name="userId">Id użytkownika</param>
        /// <returns>Analiza rynku pracy w formacie DTO</returns>
        Task<MarketAnalysisResponseDto> GetMarketAnalysisAsync(string userId);
        Task<MarketAnalysisResponseDto> GetLatestMarketAnalysisAsync(string userId);
    }
}
