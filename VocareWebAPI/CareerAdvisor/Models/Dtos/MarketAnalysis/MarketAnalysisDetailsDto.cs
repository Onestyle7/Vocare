using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VocareWebAPI.Models.Dtos.MarketAnalysis
{
    /// <summary>
    /// DTO reprezentujące szczegółowe dane analizy rynku pracy, używany do transferu danych między serwisem a API Perplexity.
    /// </summary>
    public class MarketAnalysisDetailsDto
    {
        public List<IndustryStatisticsDto> IndustryStatistics { get; set; } =
            new List<IndustryStatisticsDto>();
        public List<SkillDemandDto> SkillDemand { get; set; } = new List<SkillDemandDto>();
        public List<MarketTrendsDto> MarketTrends { get; set; } = new List<MarketTrendsDto>();
    }
}
