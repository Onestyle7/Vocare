using Microsoft.EntityFrameworkCore;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.Data;

namespace VocareWebAPI.CvGenerator.Repositories.Implementations
{
    public class GeneratedCvrepository : IGeneratedCvRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<GeneratedCvrepository> _logger;

        public GeneratedCvrepository(AppDbContext context, ILogger<GeneratedCvrepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<GeneratedCv> AddAsync(GeneratedCv generatedCv)
        {
            _logger.LogInformation("Adding new CV for user: {UserId}", generatedCv.UserId);

            // Ustawiamy dane techniczne CV
            generatedCv.CreatedAt = DateTime.UtcNow;
            generatedCv.LastModifiedAt = DateTime.UtcNow;
            generatedCv.Version = 1;
            generatedCv.IsActive = true;

            // Dodajemy do kontekstu i zapisujemy zmiany
            _context.GeneratedCvs.Add(generatedCv);
            await _context.SaveChangesAsync();

            return generatedCv;
        }

        public async Task<GeneratedCv?> GetByIdAsync(Guid id)
        {
            // Pobieramy tylko aktywne CV
            return await _context
                .GeneratedCvs.Where(cv => cv.Id == id && cv.IsActive)
                .FirstOrDefaultAsync();
        }

        public async Task<List<GeneratedCv>> GetUserCvsAsync(string userId)
        {
            // Pobieramy wszystkie aktywne CV użytkownika, sortując je według domyślności i daty modyfikacji. Pierwsze widzi domyślne, potem od najnowszych
            return await _context
                .GeneratedCvs.Where(cv => cv.UserId == userId && cv.IsActive)
                .OrderByDescending(cv => cv.IsDefault)
                .ThenByDescending(cv => cv.LastModifiedAt)
                .ToListAsync();
        }

        public async Task<int> GetUserCvCountAsync(string userId)
        {
            // Zliczamy liczbę aktywnych CV użytkownika - przyszłościowo, gdybyśmy chcieli ograniczyć liczbę CV, lub dodać płatną opcję posiadania większej liczby CV
            return await _context.GeneratedCvs.CountAsync(cv => cv.UserId == userId && cv.IsActive);
        }

        public async Task<GeneratedCv?> GetUserDefaultCvAsync(string userId)
        {
            return await _context
                .GeneratedCvs.Where(cv => cv.UserId == userId && cv.IsDefault && cv.IsActive)
                .FirstOrDefaultAsync();
        }

        public async Task<GeneratedCv> UpdateAsync(GeneratedCv generatedCv)
        {
            _logger.LogInformation(
                "Updating CV: {CvId} for user: {UserId}",
                generatedCv.Id,
                generatedCv.UserId
            );

            generatedCv.LastModifiedAt = DateTime.UtcNow;
            generatedCv.Version++;
            _context.GeneratedCvs.Update(generatedCv);

            await _context.SaveChangesAsync();
            return generatedCv;
        }

        public async Task<bool> DeactivateAsync(Guid id)
        {
            // Zamiast twardego delete, oznaczamy CV jako nieaktywne - to pozwala na zachowanie historii
            // TODO: Zaimplementować archiwizację lub usuwanie nieaktywnych CV po pewnym czasie, lub po pewnej liczbie nieaktywnych CV
            var cv = await GetByIdAsync(id);
            if (cv == null)
            {
                _logger.LogWarning("CV with ID {CvId} not found for deactivation", id);
                return false;
            }

            _logger.LogInformation("Deactivating CV: {CvId}", id);

            cv.IsActive = false;
            cv.LastModifiedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task SetDefaultAsync(Guid cvId, string userId)
        {
            // Ustawiamy domyślne CV, dla użytkownika, może być przydatne przy implementacji AI do oceny/optymalizacji CV
            _logger.LogInformation("Setting default CV: {CvId} for user: {UserId}", cvId, userId);

            // Najpierw resetujemy wszystkie CV użytkownika
            var userCvs = await _context
                .GeneratedCvs.Where(cv => cv.UserId == userId && cv.IsActive)
                .ToListAsync();

            foreach (var cv in userCvs)
            {
                cv.IsDefault = cv.Id == cvId;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<bool> BelongsToUserAsync(Guid cvId, string userId)
        {
            return await _context.GeneratedCvs.AnyAsync(cv =>
                cv.Id == cvId && cv.UserId == userId && cv.IsActive
            );
        }
    }
}
