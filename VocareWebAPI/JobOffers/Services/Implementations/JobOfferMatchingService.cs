using Microsoft.EntityFrameworkCore;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Models.Dtos;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Interfaces;
using VocareWebAPI.Repositories;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class JobOfferMatchingService : IJobOfferMatchingService
    {
        private readonly AppDbContext _context;
        private readonly IJobOfferRecommendationRepository _jobOfferRecommendationRepository;
        private readonly IAiRecommendationRepository _aiRecommendationRepository;
        private readonly ILogger<JobOfferMatchingService> _logger;

        public JobOfferMatchingService(
            AppDbContext context,
            IJobOfferRecommendationRepository jobOfferRecommendationRepository,
            IAiRecommendationRepository aiRecommendationRepository,
            ILogger<JobOfferMatchingService> logger
        )
        {
            _context = context;
            _jobOfferRecommendationRepository = jobOfferRecommendationRepository;
            _aiRecommendationRepository = aiRecommendationRepository;
            _logger = logger;
        }

        public async Task<List<JobOfferMatchDto>> GetMatchingOffersForCareerPathAsync(
            Guid careerPathId,
            int limit = 5
        )
        {
            _logger.LogInformation(
                "Szukam ofert dla ścieżki kariery: {CareerPathId}",
                careerPathId
            );

            // Pobieramy ścieżkę kariery z embeddingiem
            var careerPath = await _context
                .Set<VocareWebAPI.Models.Entities.CareerPath>()
                .FirstOrDefaultAsync(cp => cp.Id == careerPathId);

            if (careerPath == null)
            {
                _logger.LogWarning("Nie znaleziono ścieżki kariery: {CareerPathId}", careerPathId);
                throw new ArgumentException($"Nie znaleziono ścieżki kariery o ID: {careerPathId}");
            }

            if (careerPath.Embedding == null)
            {
                _logger.LogWarning(
                    "Ścieżka kariery {CareerPathId} nie ma embeddingu",
                    careerPathId
                );
                return new List<JobOfferMatchDto>();
            }

            // Pobieramy filtry z profilu użytkownika (przez rekomendację)
            var filters = await GetFiltersFromCareerPathAsync(careerPathId);

            _logger.LogInformation(
                "Filtry dla ścieżki {CareerPathId}: Miasta={Cities}, Remote={Remote}, Seniority={Seniority}",
                careerPathId,
                filters.Cities != null ? string.Join(", ", filters.Cities) : "brak",
                filters.IncludeRemote,
                filters.SeniorityLevels != null
                    ? string.Join(", ", filters.SeniorityLevels)
                    : "brak"
            );

            // Szukamy pasujących ofert z filtrami
            var matchingOffers = await _jobOfferRecommendationRepository.GetMatchingOffersAsync(
                careerPath.Embedding,
                filters,
                limit
            );

            _logger.LogInformation(
                "Znaleziono {Count} ofert dla ścieżki: {CareerName}",
                matchingOffers.Count,
                careerPath.CareerName
            );

            return matchingOffers.Select(MapToDto).ToList();
        }

        public async Task<Dictionary<Guid, List<JobOfferMatchDto>>> GetMatchingOffersForUserAsync(
            string userId,
            int limitPerPath = 5
        )
        {
            _logger.LogInformation(
                "Szukam ofert dla wszystkich ścieżek użytkownika: {UserId}",
                userId
            );

            var recommendation = await _aiRecommendationRepository.GetLatestByUserIdAsync(userId);

            if (recommendation == null)
            {
                _logger.LogWarning("Brak rekomendacji dla użytkownika: {UserId}", userId);
                throw new InvalidOperationException($"Brak rekomendacji dla użytkownika: {userId}");
            }

            // Pobieramy filtry z profilu użytkownika
            var filters = await GetFiltersFromUserProfileAsync(userId);

            _logger.LogInformation(
                "Filtry dla użytkownika {UserId}: Miasta={Cities}, Remote={Remote}",
                userId,
                filters.Cities != null ? string.Join(", ", filters.Cities) : "brak",
                filters.IncludeRemote
            );

            var result = new Dictionary<Guid, List<JobOfferMatchDto>>();

            foreach (var careerPath in recommendation.CareerPaths)
            {
                if (careerPath.Embedding == null)
                {
                    _logger.LogDebug(
                        "Ścieżka {CareerName} nie ma embeddingu - pomijam",
                        careerPath.CareerName
                    );
                    result[careerPath.Id] = new List<JobOfferMatchDto>();
                    continue;
                }

                var matchingOffers = await _jobOfferRecommendationRepository.GetMatchingOffersAsync(
                    careerPath.Embedding,
                    filters,
                    limitPerPath
                );

                result[careerPath.Id] = matchingOffers.Select(MapToDto).ToList();

                _logger.LogDebug(
                    "Znaleziono {Count} ofert dla ścieżki: {CareerName}",
                    matchingOffers.Count,
                    careerPath.CareerName
                );
            }

            return result;
        }

        /// <summary>
        /// Pobiera filtry na podstawie profilu użytkownika powiązanego ze ścieżką kariery
        /// </summary>
        private async Task<JobOfferFilterCriteria> GetFiltersFromCareerPathAsync(Guid careerPathId)
        {
            // Znajdujemy rekomendację zawierającą tę ścieżkę
            var recommendation = await _context
                .AiRecommendations.Include(r => r.UserProfile)
                .Include(r => r.CareerPaths)
                .FirstOrDefaultAsync(r => r.CareerPaths.Any(cp => cp.Id == careerPathId));

            if (recommendation?.UserProfile == null)
            {
                return new JobOfferFilterCriteria { IncludeRemote = true };
            }

            return BuildFiltersFromProfile(recommendation.UserProfile);
        }

        /// <summary>
        /// Pobiera filtry na podstawie profilu użytkownika
        /// </summary>
        private async Task<JobOfferFilterCriteria> GetFiltersFromUserProfileAsync(string userId)
        {
            var userProfile = await _context.UserProfiles.FirstOrDefaultAsync(up =>
                up.UserId == userId
            );

            if (userProfile == null)
            {
                return new JobOfferFilterCriteria { IncludeRemote = true };
            }

            return BuildFiltersFromProfile(userProfile);
        }

        /// <summary>
        /// Buduje kryteria filtrowania na podstawie profilu użytkownika
        /// </summary>
        private JobOfferFilterCriteria BuildFiltersFromProfile(
            VocareWebAPI.Models.Entities.UserProfile profile
        )
        {
            var filters = new JobOfferFilterCriteria
            {
                IncludeRemote = true, // Zawsze uwzględniamy remote
                Cities = new List<string>(),
            };

            // Wyciągamy miasto z adresu użytkownika
            if (!string.IsNullOrWhiteSpace(profile.Address))
            {
                // Address może być w formacie "Wrocław" lub "Wrocław, ul. Przykładowa 1"
                var city = profile.Address.Split(',')[0].Trim();
                if (!string.IsNullOrWhiteSpace(city))
                {
                    filters.Cities.Add(city);
                }
            }

            // Jeśli nie mamy miasta, nie filtrujemy po lokalizacji
            if (!filters.Cities.Any())
            {
                filters.Cities = null;
            }

            // TODO: W przyszłości można dodać:
            // - Filtr seniority na podstawie lat doświadczenia
            // - Filtr kategorii na podstawie umiejętności

            return filters;
        }

        private JobOfferMatchDto MapToDto(VocareWebAPI.JobOffers.Models.Entities.JobOffer offer)
        {
            return new JobOfferMatchDto
            {
                Id = offer.Id,
                Title = offer.Title,
                CompanyName = offer.CompanyName,
                Url = offer.Url,
                Category = offer.Category,
                SeniorityLevel = offer.SeniorityLevel.ToString(),
                BriefDescription = offer.BriefDescription,
                SalaryMin = offer.SalaryMin,
                SalaryMax = offer.SalaryMax,
                SalaryCurrency = offer.SalaryCurrency,
                Locations =
                    offer.Locations?.Select(l => l.IsRemote ? "Remote" : l.City).ToList()
                    ?? new List<string>(),
                Skills = offer.Skills?.Select(s => s.Name).ToList() ?? new List<string>(),
                PublishedAt = offer.PublishedAt,
            };
        }
    }
}
