using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Entities.MarketAnalysis
{
    /// <summary>
    /// Encja reprezentująca zapotrzebowanie na konkretną umiejętność w kontekście zaproponowanego przez AI zawodu
    /// </summary>
    public class SkillDemand
    {
        [Key]
        public Guid Id { get; set; }
        public string SkillName { get; set; } = String.Empty;
        public string Industry { get; set; } = String.Empty;
        public string DemandLevel { get; set; } = String.Empty;
        public DateTime LastUpdated { get; set; }
        public Guid AiRecommendationId { get; set; }
    }
}
