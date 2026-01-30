using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobOffers.Services.Interfaces
{
    public interface IScoringService
    {
        int CalculateFinalScore(
            double semanticScore,
            double skillScore,
            bool categoryMatched,
            bool seniorityMatched
        );
        string DetermineConfidenceLevel(int score, int totalOffersInCategory);
        string? GenerateDataQualityWarning(int score, int totalOffersInCategory);
    }
}
