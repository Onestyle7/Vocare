using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities.MarketAnalysis;
using VocareWebAPI.Repositories.Interfaces;

namespace VocareWebAPI.Repositories.Implementations
{
    public class SkillDemandRepository : ISkillDemandRepository
    {
        private readonly AppDbContext _context;

        public SkillDemandRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(SkillDemand entity)
        {
            await _context.SkillDemand.AddAsync(entity);
            await _context.SaveChangesAsync();
        }
    }
}
