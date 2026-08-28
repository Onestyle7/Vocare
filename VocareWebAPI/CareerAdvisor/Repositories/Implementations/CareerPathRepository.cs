using VocareWebAPI.CareerAdvisor.Repositories.Interfaces;
using VocareWebAPI.Data;
using VocareWebAPI.Models.Entities;

namespace VocareWebAPI.CareerAdvisor.Repositories.Implementations
{
    public class CareerPathRepository : ICareerPathRepository
    {
        private readonly AppDbContext _context;

        public CareerPathRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CareerPath?> GetByIdAsync(Guid id)
        {
            return await _context.CareerPaths.FindAsync(id);
        }
    }
}
