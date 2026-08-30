using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.JobOffers.Models.Dtos
{
    /// <summary>
    /// Szczegóły dopasowania oferty pracy do rekomendowanej ścieżki kariery
    /// </summary>
    public class MatchDetailsDto
    {
        public int SemanticScore { get; set; }
        public int SkillScore { get; set; }

        /// <summary>
        /// Umiejętności które dopasowały się na poziomie >=80% np. Figma -> Figma (100%) "UX Research -> User Research"85%)
        /// </summary>
        public List<string> MatchedSkills { get; set; } = new();

        /// <summary>
        /// Umiejętności które dopasowały się na poziomie 60-80% np. "Adobe Photoshop -> Photo Editing (75%)"
        /// </summary>
        public List<string> PartialMatches { get; set; } = new();

        /// <summary>
        /// Umiejętności wymagane, których nie znaleziono w ofertcie
        /// </summary>
        public List<string> MissingSkills { get; set; } = new();

        /// <summary>
        /// Umiejętności z oferty, które użytkownik już posiada
        /// </summary>
        public List<string> UserMatchedSkills { get; set; } = new();

        /// <summary>
        /// Dodatkowe cenych które zostały potwierdzone w dopasowaniu, np. poziom doświadczenia
        /// </summary>
        public List<string> BonusFactors { get; set; } = new();
    }
}
