using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Polly;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities.MarketAnalysis;
using VocareWebAPI.Repositories.Interfaces;

namespace VocareWebAPI.Repositories.Implementations
{
    public class CareerStatisticsRepository : ICareerStatisticsRepository
    {
        private readonly AppDbContext _context;

        public CareerStatisticsRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(CareerStatistics entity)
        {
            await _context.CareerStatistics.AddAsync(entity);
            await _context.SaveChangesAsync();
        }
    }
}
