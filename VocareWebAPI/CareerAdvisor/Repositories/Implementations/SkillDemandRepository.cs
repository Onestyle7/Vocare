using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities.MarketAnalysis;
using VocareWebAPI.Repositories.Interfaces;

namespace VocareWebAPI.Repositories.Implementations
{
    /// <summary>
    /// Repozytorium odpowiedzialne za operacje na zapotrzebowaniu na umiejętności w bazie danych
    /// </summary>
    public class SkillDemandRepository : ISkillDemandRepository
    {
        private readonly AppDbContext _context;

        /// <summary>
        /// Inicjalizuje instancję repozytorium
        /// </summary>
        /// <param name="context"></param>
        public SkillDemandRepository(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Dodaje nowe zapotrzebowanie na umiejętność do bazy danych
        /// </summary>
        /// <param name="entity">Zapotrzebowanie na umiejętność do dodania</param>
        /// <returns>Task reprezentujący operację asynchroniczną</returns>
        public async Task AddAsync(SkillDemand entity)
        {
            await _context.SkillDemand.AddAsync(entity);
            await _context.SaveChangesAsync();
        }
    }
}
