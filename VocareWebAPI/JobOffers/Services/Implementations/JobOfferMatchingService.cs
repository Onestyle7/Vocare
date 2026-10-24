using Microsoft.EntityFrameworkCore;
using Pgvector;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Exceptions;
using VocareWebAPI.JobOffers.Models.Dtos;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Models.Enums;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Interfaces;
using VocareWebAPI.Models.Entities;
using VocareWebAPI.Repositories;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class JobOfferMatchingService : IJobOfferMatchingService
    {
        private readonly AppDbContext _context;
        private readonly IJobOfferRecommendationRepository _jobOfferRecommendationRepository;
        private readonly IAiRecommendationRepository _aiRecommendationRepository;
        private readonly ILogger<JobOfferMatchingService> _logger;
        private readonly ISkillMatchingService _skillMatchingService;
        private readonly IScoringService _scoringService;

        public JobOfferMatchingService(
            AppDbContext context,
            IJobOfferRecommendationRepository jobOfferRecommendationRepository,
            IAiRecommendationRepository aiRecommendationRepository,
            ILogger<JobOfferMatchingService> logger,
            ISkillMatchingService skillMatchingService,
            IScoringService scoringService
        )
        {
            _context = context;
            _jobOfferRecommendationRepository = jobOfferRecommendationRepository;
            _aiRecommendationRepository = aiRecommendationRepository;
            _logger = logger;
            _skillMatchingService = skillMatchingService;
            _scoringService = scoringService;
        }

        public async Task<List<JobOfferMatchDto>> GetMatchingOffersForCareerPathAsync(
            Guid careerPathId,
            int limit = 5
        )
        {
            // Pobieramy ścieżkę kariery z embeddingiem
            var careerPath = await _context
                .Set<CareerPath>()
                .FirstOrDefaultAsync(cp => cp.Id == careerPathId);

            if (careerPath == null)
                throw new CareerPathNotFoundException(careerPathId);

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

            var userSkills = await GetUserSkillsFromCareerPathAsync(careerPathId);

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
            var recommendation = await _aiRecommendationRepository.GetLatestByUserIdAsync(userId);

            if (recommendation == null)
                return new Dictionary<Guid, List<JobOfferMatchDto>>();

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

                var filters = await GetFiltersFromCareerPathAsync(careerPath.Id);

                _logger.LogInformation(
                    "Filtry dla ścieżki {CareerName}: Miasta={Cities}, Remote={Remote}, Seniority={Seniority}, Kategorie={Categories}",
                    careerPath.CareerName,
                    filters.Cities != null ? string.Join(", ", filters.Cities) : "brak",
                    filters.IncludeRemote,
                    filters.SeniorityLevels != null
                        ? string.Join(", ", filters.SeniorityLevels)
                        : "brak",
                    filters.Categories != null ? string.Join(", ", filters.Categories) : "brak"
                );

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

        public async Task<CareerPathMatchResultDto> GetMatchingOffersWithScoreAsync(
            Guid careerPathId,
            int limit = 5
        )
        {
            _logger.LogInformation(
                "Szukam ofert dla ścieżki kariery z oceną: {CareerPathId}",
                careerPathId
            );

            var careerPath = await _context
                .Set<CareerPath>()
                .FirstOrDefaultAsync(cp => cp.Id == careerPathId);

            if (careerPath == null)
                throw new CareerPathNotFoundException(careerPathId);

            if (careerPath.Embedding == null)
            {
                _logger.LogWarning(
                    "Ścieżka kariery {CareerPathId} nie ma embeddingu",
                    careerPathId
                );
                return new CareerPathMatchResultDto
                {
                    CareerPathId = careerPathId,
                    CareerPathName = careerPath.CareerName,
                    RequiredSkills = careerPath.RequiredSkills ?? new List<string>(),
                    DataQualityWarning =
                        "Brak embeddingu dla ścieżki kariery - nie można dopasować ofert.",
                };
            }

            var filters = await GetFiltersFromCareerPathAsync(careerPathId);
            var userSkills = await GetUserSkillsFromCareerPathAsync(careerPathId);

            var candidateOffers = await _jobOfferRecommendationRepository.GetMatchingOffersAsync(
                careerPath.Embedding,
                filters,
                limit * 4
            );

            var totalOffersInCategory = candidateOffers.Count;

            var scoredOffers = new List<ScoredJobOfferDto>();

            foreach (var offer in candidateOffers)
            {
                var semanticScore = CalculateSemanticScore(careerPath.Embedding, offer.Embedding);

                var skillMatchResult = await _skillMatchingService.CalculateSkillMatchAsync(
                    careerPath.RequiredSkills ?? new List<string>(),
                    offer.Skills?.Select(s => s.Name).ToList() ?? new List<string>()
                );

                var offerSkillNames =
                    offer.Skills?.Select(s => s.Name).ToList() ?? new List<string>();
                SkillMatchResult? userSkillMatch = null;
                if (userSkills.Any())
                {
                    userSkillMatch = await _skillMatchingService.CalculateSkillMatchAsync(
                        offerSkillNames,
                        userSkills
                    );
                }

                // Kategorie z AI są w camelCase (np. "businessAnalyst") - porównanie musi ignorować wielkość liter,
                // tak samo jak filtr w SQL (lower(...) = ANY(...))
                var categoryMatched =
                    filters.Categories != null
                    && filters.Categories.Contains(
                        offer.Category,
                        StringComparer.OrdinalIgnoreCase
                    );
                var seniorityMatched =
                    filters.SeniorityLevels != null
                    && filters.SeniorityLevels.Contains(offer.SeniorityLevel);

                var finalScore = _scoringService.CalculateFinalScore(
                    semanticScore,
                    skillMatchResult.Score,
                    categoryMatched,
                    seniorityMatched
                );

                var confidenceLevel = _scoringService.DetermineConfidenceLevel(
                    finalScore,
                    totalOffersInCategory
                );

                var bonusFactors = new List<string>();
                if (categoryMatched)
                    bonusFactors.Add("categoryMatch");
                if (seniorityMatched)
                    bonusFactors.Add("seniorityMatch");

                var matchedSkillsList = skillMatchResult
                    .FullMatches.Select(m =>
                        $"{m.Key} → {m.Value.MatchedSkill} ({m.Value.Similarity:P0})"
                    )
                    .ToList();

                var partialMatchesList = skillMatchResult
                    .PartialMatches.Select(m =>
                        $"{m.Key} → {m.Value.MatchedSkill} ({m.Value.Similarity:P0})"
                    )
                    .ToList();

                scoredOffers.Add(
                    new ScoredJobOfferDto
                    {
                        Id = offer.Id,
                        Title = offer.Title,
                        CompanyName = offer.CompanyName,
                        Url = offer.Url,
                        Category = offer.Category,
                        SeniorityLevel = offer.SeniorityLevel.ToString(),
                        BriefDescription = offer.BriefDescription,
                        DescriptionPreview = offer.Description.ToDescriptionPreview(),
                        SalaryMin = offer.SalaryMin,
                        SalaryMax = offer.SalaryMax,
                        SalaryCurrency = offer.SalaryCurrency,
                        SalaryPeriod = offer.SalaryPeriod,
                        Locations = offer.Locations.ToDisplayLocations(),
                        Skills = offer.Skills?.Select(s => s.Name).ToList() ?? new List<string>(),
                        PublishedAt = offer.PublishedAt,
                        Source = offer.Source,

                        MatchScore = finalScore,
                        ConfidenceLevel = confidenceLevel,
                        MatchDetails = new MatchDetailsDto
                        {
                            SemanticScore = (int)Math.Round(semanticScore),
                            SkillScore = (int)Math.Round(skillMatchResult.Score),
                            MatchedSkills = matchedSkillsList,
                            PartialMatches = partialMatchesList,
                            MissingSkills =
                                userSkillMatch != null
                                    ? userSkillMatch.MissingSkills
                                    : offerSkillNames,
                            UserMatchedSkills =
                                userSkillMatch != null
                                    ? userSkillMatch
                                        .FullMatches.Select(m =>
                                            $"{m.Key} → {m.Value.MatchedSkill} ({m.Value.Similarity:P0})"
                                        )
                                        .Concat(
                                            userSkillMatch.PartialMatches.Select(m =>
                                                $"{m.Key} → {m.Value.MatchedSkill} ({m.Value.Similarity:P0})"
                                            )
                                        )
                                        .ToList()
                                    : new List<string>(),
                            BonusFactors = bonusFactors,
                        },
                    }
                );
            }

            var topOffers = scoredOffers.OrderByDescending(o => o.MatchScore).Take(limit).ToList();

            var averageScore = topOffers.Any() ? topOffers.Average(o => o.MatchScore) : 0;

            var highQualityCount = topOffers.Count(o => o.MatchScore >= 70);

            var dataQualityWarning = _scoringService.GenerateDataQualityWarning(
                (int)averageScore,
                totalOffersInCategory
            );

            return new CareerPathMatchResultDto
            {
                CareerPathId = careerPathId,
                CareerPathName = careerPath.CareerName,
                RequiredSkills = careerPath.RequiredSkills ?? new List<string>(),
                MatchedOffers = topOffers,
                AverageMatchScore = averageScore,
                HighQualityMatches = highQualityCount,
                TotalOffersInCategory = totalOffersInCategory,
                DataQualityWarning = dataQualityWarning,
            };
        }

        public async Task<List<CareerPathMatchResultDto>> GetMatchingOffersWithScoresForUserAsync(
            string userId,
            int limitPerPath = 5
        )
        {
            var recommendation = await _aiRecommendationRepository.GetLatestByUserIdAsync(userId);

            if (recommendation == null)
                return new List<CareerPathMatchResultDto>();

            var result = new List<CareerPathMatchResultDto>();

            foreach (var careerPath in recommendation.CareerPaths)
            {
                var matchResult = await GetMatchingOffersWithScoreAsync(
                    careerPath.Id,
                    limitPerPath
                );
                result.Add(matchResult);
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
                .ThenInclude(u => u.WorkExperience)
                .Include(r => r.CareerPaths)
                .FirstOrDefaultAsync(r => r.CareerPaths.Any(cp => cp.Id == careerPathId));

            if (recommendation?.UserProfile == null)
            {
                return new JobOfferFilterCriteria { IncludeRemote = true };
            }

            var careerPath = recommendation.CareerPaths.FirstOrDefault(cp => cp.Id == careerPathId);
            var filters = BuildFiltersFromProfile(recommendation.UserProfile);

            if (careerPath != null)
            {
                if (!string.IsNullOrEmpty(careerPath.SuggestedSeniority))
                {
                    filters.SeniorityLevels = MapSeniorityToAllowedLevels(
                        careerPath.SuggestedSeniority
                    );
                }

                if (
                    careerPath.AllowedJobCategories != null
                    && careerPath.AllowedJobCategories.Any()
                )
                {
                    filters.Categories = careerPath.AllowedJobCategories;
                }
            }

            return filters;
        }

        /// <summary>
        /// Mapuje sugerowany poziom seniority na dozwolone poziomy w ofertach
        /// </summary>
        private List<SeniorityLevel> MapSeniorityToAllowedLevels(string suggestedSeniority)
        {
            return suggestedSeniority.ToLower() switch
            {
                "junior" => new List<SeniorityLevel>
                {
                    SeniorityLevel.Trainee,
                    SeniorityLevel.Junior,
                },
                "mid" => new List<SeniorityLevel> { SeniorityLevel.Junior, SeniorityLevel.Mid },
                "senior" => new List<SeniorityLevel>
                {
                    SeniorityLevel.Mid,
                    SeniorityLevel.Senior,
                    SeniorityLevel.Expert,
                },
                _ => new List<SeniorityLevel>
                {
                    SeniorityLevel.Junior,
                    SeniorityLevel.Mid,
                    SeniorityLevel.Senior,
                },
            };
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
                return new JobOfferFilterCriteria { IncludeRemote = true };

            return BuildFiltersFromProfile(userProfile);
        }

        /// <summary>
        /// Buduje kryteria filtrowania na podstawie profilu użytkownika
        /// </summary>
        private JobOfferFilterCriteria BuildFiltersFromProfile(UserProfile profile)
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

        private JobOfferMatchDto MapToDto(JobOffer offer)
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
                DescriptionPreview = offer.Description.ToDescriptionPreview(),
                SalaryMin = offer.SalaryMin,
                SalaryMax = offer.SalaryMax,
                SalaryCurrency = offer.SalaryCurrency,
                SalaryPeriod = offer.SalaryPeriod,
                Locations = offer.Locations.ToDisplayLocations(),
                Skills = offer.Skills?.Select(s => s.Name).ToList() ?? new List<string>(),
                PublishedAt = offer.PublishedAt,
                Source = offer.Source,
            };
        }

        private double CalculateCosineSimilarity(float[] vectorA, float[] vectorB)
        {
            if (vectorA.Length != vectorB.Length)
                throw new ArgumentException("Vectors must be of the same length");

            double dotProduct = 0;
            double magnitudeA = 0;
            double magnitudeB = 0;

            for (int i = 0; i < vectorA.Length; i++)
            {
                dotProduct += vectorA[i] * vectorB[i];
                magnitudeA += vectorA[i] * vectorA[i];
                magnitudeB += vectorB[i] * vectorB[i];
            }
            magnitudeA = Math.Sqrt(magnitudeA);
            magnitudeB = Math.Sqrt(magnitudeB);

            if (magnitudeA == 0 || magnitudeB == 0)
            {
                return 0;
            }

            return dotProduct / (magnitudeA * magnitudeB);
        }

        private double CalculateSemanticScore(
            Vector? careerPathEmbedding,
            Vector? jobOfferEmbedding
        )
        {
            if (careerPathEmbedding == null || jobOfferEmbedding == null)
            {
                return 0;
            }
            return CalculateCosineSimilarity(
                    careerPathEmbedding.ToArray(),
                    jobOfferEmbedding.ToArray()
                ) * 100;
        }

        /// <summary>
        /// Pobiera połączone umiejętności użytkownika (Skills + SoftSkills) na podstawie ścieżki kariery
        /// </summary>
        private async Task<List<string>> GetUserSkillsFromCareerPathAsync(Guid careerPathId)
        {
            var recommendation = await _context
                .AiRecommendations.Include(r => r.UserProfile)
                .FirstOrDefaultAsync(r => r.CareerPaths.Any(cp => cp.Id == careerPathId));

            if (recommendation?.UserProfile == null)
            {
                return new List<string>();
            }

            var allSkills = new List<string>();

            if (recommendation.UserProfile.Skills != null)
                allSkills.AddRange(recommendation.UserProfile.Skills);

            if (recommendation.UserProfile.SoftSkills != null)
                allSkills.AddRange(recommendation.UserProfile.SoftSkills);

            return allSkills;
        }
    }
}
