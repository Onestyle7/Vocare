using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.Data;

namespace VocareWebAPI.CvGenerator.Repositories.Implementations
{
    public class GeneratedCvrepository : IGeneratedCvRepository
    {
        private readonly AppDbContext _context;

        public GeneratedCvrepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(GeneratedCv generatedCv)
        {
            _context.GeneratedCvs.Add(generatedCv);
            await _context.SaveChangesAsync();
        }
    }
}
