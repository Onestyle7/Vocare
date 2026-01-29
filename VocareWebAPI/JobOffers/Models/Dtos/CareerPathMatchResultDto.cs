using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobOffers.Models.Dtos
{
    public class CareerPathMatchResultDto
    {
        public Guid CareerPathId { get; set; }
        public string CareerPathName { get; set; } = "";

        /// <summary>
        /// Wymagane umiejętności
        /// </summary>
        public List<string> RequiredSkills { get; set; } = new();

        /// <summary>
        /// Lista ofert ze scoringiem
        /// </summary>
        public List<ScoredJobOfferDto> MatchedOffers { get; set; } = new();

        /// <summary>
        /// Średni score wszystkich ofert
        /// </summary>
        public double AverageMatchScore { get; set; }

        /// <summary>
        /// Ile ofert ma score >= 70
        /// </summary>
        public int HighQualityMatches { get; set; }

        /// <summary>
        /// Ile jest ofert w kategorii
        /// </summary>
        public int TotalOffersInCategory { get; set; }
        public string? DataQualityWarning { get; set; }
    }
}
