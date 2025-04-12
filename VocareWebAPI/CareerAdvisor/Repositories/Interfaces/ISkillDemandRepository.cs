using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Models.Entities.MarketAnalysis;

namespace VocareWebAPI.Repositories.Interfaces
{
    /// <summary>
    /// Interfejs repozytorium dla operacji na zapotrzebowaniu na umiejętności w bazie danych
    /// </summary>
    public interface ISkillDemandRepository
    {
        /// <summary>
        /// Dodaje nowe zapotrzebowanie na umiejętność do bazy danych
        /// </summary>
        /// <param name="entity">Zapotrzebowanie na umiejętność do dodania</param>
        /// <returns>Task reprezentujący operację asynchroniczną</returns>
        Task AddAsync(SkillDemand entity);
    }
}
