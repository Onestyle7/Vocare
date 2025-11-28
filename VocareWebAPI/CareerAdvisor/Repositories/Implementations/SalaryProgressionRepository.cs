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
    public class SalaryProgressionRepository : ISalaryProgressionRepository
    {
        private readonly AppDbContext _context;

        public SalaryProgressionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(SalaryProgression entity)
        {
            await _context.SalaryProgressions.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<List<SalaryProgression>> GetByCareerStatisticsIdAsync(
            Guid careerStatisticsId
        )
        {
            return await _context
                .SalaryProgressions.Where(sp => sp.CareerStatisticsId == careerStatisticsId)
                .OrderBy(sp => sp.CareerLevel)
                .ToListAsync();
        }

        public async Task DeleteByCareerStatisticsIdAsync(Guid careerStatisticsId)
        {
            var toDelete = _context.SalaryProgressions.Where(sp =>
                sp.CareerStatisticsId == careerStatisticsId
            );
            _context.SalaryProgressions.RemoveRange(toDelete);

            await _context.SaveChangesAsync();
        }
    }
}
