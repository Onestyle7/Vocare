using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VocareWebAPI.CareerAdvisor.Models.Entities.MarketAnalysis;
using VocareWebAPI.CareerAdvisor.Repositories.Interfaces;
using VocareWebAPI.Data;

namespace VocareWebAPI.CareerAdvisor.Repositories.Implementations
{
    public class EntryDifficultyRepository : IEntryDifficultyRepository
    {
        private readonly AppDbContext _context;

        public EntryDifficultyRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(EntryDifficulty entity)
        {
            await _context.EntryDifficulties.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<EntryDifficulty?> GetByCareerStatisticsIdAsync(Guid careerStatisticsId)
        {
            return await _context.EntryDifficulties.FirstOrDefaultAsync(e =>
                e.CareerStatisticsId == careerStatisticsId
            );
        }

        public async Task DeleteByCareerStatisticsIdAsync(Guid careerStatisticsId)
        {
            var toDelete = _context.EntryDifficulties.FirstOrDefault(e =>
                e.CareerStatisticsId == careerStatisticsId
            );

            if (toDelete != null)
            {
                _context.EntryDifficulties.Remove(toDelete);
                await _context.SaveChangesAsync();
            }
        }
    }
}
