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
    public class AiNarratorRepository : IAiNarratorRepository
    {
        private readonly AppDbContext _context;

        public AiNarratorRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(AiNarrator entity)
        {
            await _context.AiNarrators.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<AiNarrator?> GetByCareerStatisticsIdAsync(Guid careerStatisticsId)
        {
            return await _context.AiNarrators.FirstOrDefaultAsync(an =>
                an.CareerStatisticsId == careerStatisticsId
            );
        }

        public async Task DeleteByCareerStatisticsIdAsync(Guid careerStatisticsId)
        {
            var toDelete = _context.AiNarrators.FirstOrDefault(e =>
                e.CareerStatisticsId == careerStatisticsId
            );

            if (toDelete != null)
            {
                _context.AiNarrators.Remove(toDelete);
                await _context.SaveChangesAsync();
            }
        }
    }
}
