using VocareWebAPI.JobOffers.Services.Interfaces;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class SkillMatchingService : ISkillMatchingService
    {
        private readonly ISkillEmbeddingService _skillEmbeddingService;
        private readonly ILogger<SkillMatchingService> _logger;
        private const double FullMatchThreshold = 0.75;
        private const double PartialMatchThreshold = 0.6;

        public SkillMatchingService(
            ISkillEmbeddingService skillEmbeddingService,
            ILogger<SkillMatchingService> logger
        )
        {
            _skillEmbeddingService = skillEmbeddingService;
            _logger = logger;
        }

        public async Task<SkillMatchResult> CalculateSkillMatchAsync(
            List<string> requiredSkills,
            List<string> offerSkills
        )
        {
            if (requiredSkills == null || !requiredSkills.Any())
            {
                return new SkillMatchResult
                {
                    Score = 100,
                    MatchedCount = 0,
                    TotalRequired = 0,
                };
            }
            if (offerSkills == null || !offerSkills.Any())
            {
                return new SkillMatchResult
                {
                    Score = 0,
                    MatchedCount = 0,
                    TotalRequired = requiredSkills.Count,
                    MissingSkills = requiredSkills.ToList(),
                };
            }

            var requiredEmbeddings = await _skillEmbeddingService.GetEmbeddingsForSkillsAsync(
                requiredSkills
            );
            var offerEmbeddings = await _skillEmbeddingService.GetEmbeddingsForSkillsAsync(
                offerSkills
            );

            var result = new SkillMatchResult { TotalRequired = requiredSkills.Count };
            double totalSimilarity = 0;

            foreach (var requiredSkill in requiredSkills)
            {
                var requiredEmbedding = requiredEmbeddings[requiredSkill];
                var (matchedSkill, similarity) = FindBestMatch(
                    requiredEmbedding,
                    offerSkills,
                    offerEmbeddings
                );

                if (similarity >= FullMatchThreshold)
                {
                    // Pełne dopasowanie >= 80%
                    result.FullMatches[requiredSkill] = new SkillMatchDetail
                    {
                        MatchedSkill = matchedSkill,
                        Similarity = similarity,
                    };
                    totalSimilarity += similarity;
                }
                else if (similarity >= PartialMatchThreshold)
                {
                    // Częściowe dopasowanie 60-80%
                    result.PartialMatches[requiredSkill] = new SkillMatchDetail
                    {
                        MatchedSkill = matchedSkill,
                        Similarity = similarity,
                    };
                    totalSimilarity += similarity;
                }
                else
                {
                    // Brak dopasowania < 60%
                    result.MissingSkills.Add(requiredSkill);
                }
            }
            result.MatchedCount = result.FullMatches.Count + result.PartialMatches.Count;
            result.Score = totalSimilarity / requiredSkills.Count * 100;
            return result;
        }

        private double CalculateCosineSimilarity(float[] vectorA, float[] vectorB)
        {
            if (vectorA.Length != vectorB.Length)
            {
                throw new ArgumentException("Vectors must be of the same length");
            }
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

        private (string MatchedSkill, double Similarity) FindBestMatch(
            float[] requiredEmbedding,
            List<string> offerSkills,
            Dictionary<string, float[]> offerEmbeddings
        )
        {
            string bestSkill = "";
            double bestSimilarity = 0;

            foreach (var skill in offerSkills)
            {
                var offerEmbedding = offerEmbeddings[skill];
                var similarity = CalculateCosineSimilarity(requiredEmbedding, offerEmbedding);
                if (similarity > bestSimilarity)
                {
                    bestSimilarity = similarity;
                    bestSkill = skill;
                }
            }
            return (bestSkill, bestSimilarity);
        }
    }
}
