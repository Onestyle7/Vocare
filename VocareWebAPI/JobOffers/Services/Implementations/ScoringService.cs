using VocareWebAPI.JobOffers.Services.Interfaces;

namespace VocareWebAPI.JobOffers.Services.Implementations
{
    public class ScoringService : IScoringService
    {
        private const double SemanticWeight = 0.4;
        private const double SkillWeight = 0.4;
        private const int CategoryBonus = 10;
        private const int SeniorityBonus = 10;

        public int CalculateFinalScore(
            double semanticScore,
            double skillScore,
            bool categoryMatched,
            bool seniorityMatched
        )
        {
            var baseScore = (semanticScore * SemanticWeight) + (skillScore * SkillWeight);
            var finalScore = baseScore;
            if (categoryMatched)
            {
                finalScore += CategoryBonus;
            }
            if (seniorityMatched)
            {
                finalScore += SeniorityBonus;
            }
            return (int)Math.Min(100, Math.Round(finalScore));
        }

        public string DetermineConfidenceLevel(int score, int totalOffersInCategory)
        {
            if (totalOffersInCategory < 5)
            {
                return "low";
            }
            else if (score >= 80)
            {
                return "high";
            }
            else if (score >= 60)
            {
                return "medium";
            }
            else if (score >= 40)
            {
                return "low";
            }
            else
            {
                return "very_low";
            }
        }

        public string? GenerateDataQualityWarning(int score, int totalOffersInCategory)
        {
            if (totalOffersInCategory < 3)
            {
                return "Very few job offers in this category may affect score reliability.";
            }
            else if (score < 40)
            {
                return "Low score may indicate poor data quality.";
            }
            else
            {
                return null;
            }
        }
    }
}
