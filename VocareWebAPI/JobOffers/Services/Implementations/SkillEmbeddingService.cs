using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Validations;
using VocareWebAPI.Data;
using VocareWebAPI.JobOffers.Models.Entities;
using VocareWebAPI.JobOffers.Repositories.Interfaces;
using VocareWebAPI.JobOffers.Services.Interfaces;
using VocareWebAPI.Shared.Services.Interfaces;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class SkillEmbeddingService : ISkillEmbeddingService
    {
        private readonly ISkillEmbeddingRepository _skillEmbeddingRepository;
        private readonly ILogger<SkillEmbeddingService> _logger;
        private readonly IEmbeddingService _embeddingService;
        private readonly AppDbContext _context;

        public SkillEmbeddingService(
            ISkillEmbeddingRepository skillEmbeddingRepository,
            ILogger<SkillEmbeddingService> logger,
            IEmbeddingService embeddingService,
            AppDbContext context
        )
        {
            _skillEmbeddingRepository = skillEmbeddingRepository;
            _logger = logger;
            _embeddingService = embeddingService;
            _context = context;
        }

        public string NormalizeSkillName(string skill)
        {
            string normalized = skill.Trim().ToLower();
            return normalized;
        }

        public async Task<Dictionary<string, float[]>> GetEmbeddingsForSkillsAsync(
            List<string> skills
        )
        {
            if (skills == null || !skills.Any())
            {
                return new Dictionary<string, float[]>();
            }

            var skillMappings = new Dictionary<string, string>();
            foreach (var skill in skills)
            {
                var normalized = NormalizeSkillName(skill);
                skillMappings[skill] = normalized;
            }

            var uniqueNormalizedSkills = skillMappings.Values.Distinct().ToList();
            var cachedEmbeddings = await _skillEmbeddingRepository.GetByNormalizedNamesAsync(
                uniqueNormalizedSkills
            );

            var foundNames = cachedEmbeddings.Select(e => e.NormalizedSkillName).ToHashSet();
            var missingNormalized = uniqueNormalizedSkills
                .Where(n => !foundNames.Contains(n))
                .ToList();

            var newEmbeddings = new List<SkillEmbedding>();

            foreach (var normalizedName in missingNormalized)
            {
                var embedding = await _embeddingService.GenerateEmbeddingAsync(normalizedName);

                var skillEmbedding = new SkillEmbedding
                {
                    Id = Guid.NewGuid(),
                    NormalizedSkillName = normalizedName,
                    OriginalName = normalizedName,
                    Embedding = embedding,
                    CreatedAt = DateTime.UtcNow,
                };

                newEmbeddings.Add(skillEmbedding);
            }

            if (newEmbeddings.Any())
            {
                await _skillEmbeddingRepository.AddRangeAsync(newEmbeddings);
            }

            var allEmbeddings = cachedEmbeddings.Concat(newEmbeddings).ToList();

            var embeddingLookup = allEmbeddings.ToDictionary(
                e => e.NormalizedSkillName,
                e => e.Embedding!.ToArray()
            );

            var result = new Dictionary<string, float[]>();

            foreach (var (originalSkill, normalizedName) in skillMappings)
            {
                if (embeddingLookup.TryGetValue(normalizedName, out var embedding))
                {
                    result[originalSkill] = embedding;
                }
            }
            return result;
        }

        #region BACKFILL DLA EMBEDDINGÓW UMIEJETNOŚCI - DO USUNIĘCIA/PRZEROBIENIA W PRZYSZŁOŚCI - Dodatkowo do usunięcia wstrzyknięcie zależności bazdy danych w tym serwisie
        public async Task<SkillBackfillResult> BackfillSkillEmbeddingsAsync()
        {
            _logger.LogInformation("Rozpoczynam backfill embeddingów dla skills...");

            // ============================================
            // KROK 1: Pobierz wszystkie skille z ofert pracy
            // ============================================
            var allSkillsFromOffers = await _context
                .JobOffers.Where(j => j.Skills != null)
                .SelectMany(j => j.Skills!)
                .Select(s => s.Name)
                .ToListAsync();

            var totalFound = allSkillsFromOffers.Count;
            _logger.LogInformation(
                "Znaleziono {Count} skills w ofertach (z duplikatami)",
                totalFound
            );

            // ============================================
            // KROK 2: Normalizuj i usuń duplikaty
            // ============================================
            var uniqueNormalized = allSkillsFromOffers
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => NormalizeSkillName(s))
                .Distinct()
                .ToList();

            _logger.LogInformation(
                "Po normalizacji: {Count} unikalnych skills",
                uniqueNormalized.Count
            );

            // ============================================
            // KROK 3: Sprawdź które już są w cache
            // ============================================
            var existingNames = await _skillEmbeddingRepository.GetAllNormalizedNamesAsync();
            var existingSet = existingNames.ToHashSet();

            var missingSkills = uniqueNormalized.Where(n => !existingSet.Contains(n)).ToList();

            var alreadyCached = uniqueNormalized.Count - missingSkills.Count;
            _logger.LogInformation(
                "Już w cache: {Cached}, do wygenerowania: {Missing}",
                alreadyCached,
                missingSkills.Count
            );

            // ============================================
            // KROK 4: Wygeneruj embeddingi dla brakujących
            // ============================================
            var newEmbeddings = new List<SkillEmbedding>();
            var generated = 0;

            foreach (var normalizedName in missingSkills)
            {
                try
                {
                    var embedding = await _embeddingService.GenerateEmbeddingAsync(normalizedName);

                    newEmbeddings.Add(
                        new SkillEmbedding
                        {
                            Id = Guid.NewGuid(),
                            NormalizedSkillName = normalizedName,
                            OriginalName = normalizedName,
                            Embedding = embedding,
                            CreatedAt = DateTime.UtcNow,
                        }
                    );

                    generated++;

                    // Loguj postęp co 50 skills
                    if (generated % 50 == 0)
                    {
                        _logger.LogInformation(
                            "Wygenerowano {Count}/{Total} embeddingów...",
                            generated,
                            missingSkills.Count
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Błąd generowania embeddingu dla: {Skill}",
                        normalizedName
                    );
                }
            }

            // ============================================
            // KROK 5: Zapisz do bazy
            // ============================================
            if (newEmbeddings.Any())
            {
                await _skillEmbeddingRepository.AddRangeAsync(newEmbeddings);
                _logger.LogInformation(
                    "Zapisano {Count} nowych embeddingów do bazy",
                    newEmbeddings.Count
                );
            }

            // ============================================
            // KROK 6: Zwróć raport
            // ============================================
            return new SkillBackfillResult
            {
                TotalSkillsFound = totalFound,
                UniqueSkillsAfterNormalization = uniqueNormalized.Count,
                AlreadyCached = alreadyCached,
                NewlyGenerated = newEmbeddings.Count,
                SampleNewSkills = newEmbeddings
                    .Take(10)
                    .Select(e => e.NormalizedSkillName)
                    .ToList(),
            };
        }
    }
        #endregion
}
