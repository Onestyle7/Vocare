using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.Repositories.Interfaces
{
    /// <summary>
    /// Interfejs repozytorium dla operacji na statystykach zawodowych w bazie danych
    /// </summary>
    public interface ICareerStatisticsRepository
    {
        /// <summary>
        /// Dodaje nowe statystyki zawodowe do bazy danych
        /// </summary>
        /// <param name="entity">Statystyki zawodowe do dodania</param>
        /// <returns>Task reprezentujący operację async</returns>
        Task AddAsync(CareerStatistics entity);
    }
}
