using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities.MarketAnalysis;
using VocareWebAPI.Repositories.Interfaces;

namespace VocareWebAPI.Repositories.Implementations
{
    public class MarketTrendsRepository : IMarketTrendsRepository
    {
        private readonly AppDbContext _context;

        public MarketTrendsRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(MarketTrends entity)
        {
            await _context.MarketTrends.AddAsync(entity);
            await _context.SaveChangesAsync();
        }
    }
}
