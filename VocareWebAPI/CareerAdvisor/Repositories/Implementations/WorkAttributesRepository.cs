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
    public class WorkAttributesRepository : IWorkAttributesRepository
    {
        private readonly AppDbContext _context;

        public WorkAttributesRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(WorkAttributes entity)
        {
            await _context.WorkAttributes.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<WorkAttributes?> GetByCareerStatisticsIdAsync(Guid careerStatisticsId)
        {
            return await _context.WorkAttributes.FirstOrDefaultAsync(wa =>
                wa.CareerStatisticsId == careerStatisticsId
            );
        }

        public async Task DeleteByCareerStatisticsIdAsync(Guid careerStatisticsId)
        {
            var toDelete = _context.WorkAttributes.FirstOrDefault(e =>
                e.CareerStatisticsId == careerStatisticsId
            );

            if (toDelete != null)
            {
                _context.WorkAttributes.Remove(toDelete);
                await _context.SaveChangesAsync();
            }
        }
    }
}
